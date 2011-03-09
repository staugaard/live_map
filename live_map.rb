#!/usr/bin/env ruby

require 'rubygems'
require "bundler"
Bundler.require

require 'evented_redis'

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
