#!/usr/bin/env ruby

require 'rubygems'
require "bundler"
Bundler.require

# Incomplete evented Redis implementation specifically made for
# the new PubSub features in Redis.
class EventedRedis < EM::Connection
  def self.connect
    host = (ENV['REDIS_HOST'] || 'localhost')
    port = (ENV['REDIS_PORT'] || 6379).to_i
    EM.connect host, port, self
  end

  def post_init
    @blocks = {}
  end
  
  def subscribe(*channels, &blk)
    channels.each { |c| @blocks[c.to_s] = blk }
    call_command('subscribe', *channels)
  end
  
  def publish(channel, msg)
    call_command('publish', channel, msg)
  end
  
  def unsubscribe
    call_command('unsubscribe')
  end
  
  def receive_data(data)
    buffer = StringIO.new(data)
    begin
      parts = read_response(buffer)
      if parts.is_a?(Array)
        ret = @blocks[parts[1]].call(parts)
        close_connection if ret === false
      end
    end while !buffer.eof?
  end
  
  private
  def read_response(buffer)
    type = buffer.read(1)
    case type
    when ':'
      buffer.gets.to_i
    when '*'
      size = buffer.gets.to_i
      parts = size.times.map { read_object(buffer) }
    else
      raise "unsupported response type"
    end
  end
  
  def read_object(data)
    type = data.read(1)
    case type
    when ':' # integer
      data.gets.to_i
    when '$'
      size = data.gets
      str = data.read(size.to_i)
      data.read(2) # crlf
      str
    else
      raise "read for object of type #{type} not implemented"
    end
  end
  
  # only support multi-bulk
  def call_command(*args)
    command = "*#{args.size}\r\n"
    args.each { |a|
      command << "$#{a.to_s.size}\r\n"
      command << a.to_s
      command << "\r\n"
    }
    send_data command
  end
end

class LiveMap
  def self.run_server(port = 8080)
    port ||= 8080
    puts "Starting WebSocket Server on port #{port}"
    EM.run do
      @channel = EM::Channel.new

      EventedRedis.connect.subscribe('live_map') do |type, channel, message|
        if type == 'message'
          puts "sending #{message} to channel"
          @channel.push(message)
        end
      end
      
      EM::WebSocket.start(:host => "0.0.0.0", :port => port) do |ws|
        subscription_id = nil
        ws.onopen do
          puts "WebSocket connection open"
          subscription_id = @channel.subscribe do |message|
            puts "sending #{message} to ws"
            ws.send(message)
          end
        end

        ws.onclose do
          puts "WebSocket connection close"
          @channel.unsubscribe(subscription_id)
        end

        ws.onmessage do |msg|
          puts "Recieved message: #{msg}"
        end
      end
    end
  end
end

LiveMap.run_server(ENV['PORT'])
