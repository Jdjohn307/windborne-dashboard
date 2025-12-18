# app/clients/windy/windy_client.rb
require "net/http"
require "json"
require "time"

module Windy
  class WindyClient
    ENDPOINT = URI("https://api.windy.com/api/point-forecast/v2")

    DEFAULT_PARAMETERS = %w[wind pressure rh].freeze
    DEFAULT_LEVELS     = %w[surface].freeze
    DEFAULT_MODEL      = "gfs"

    def self.forecast(lat:, lon:, model: DEFAULT_MODEL, levels: DEFAULT_LEVELS, parameters: DEFAULT_PARAMETERS)
      cache_key = windy_cache_key(lat, lon, model, parameters, levels)

      # check cache first
      cached = Rails.cache.read(cache_key)
      Rails.logger.info("Windy API: returning cached data for #{cache_key}") and return cached if cached
      Rails.logger.info("Windy API: not returning cached data for #{cache_key}")
      raw = request(
        lat: lat,
        lon: lon,
        parameters: parameters,
        levels: levels,
        model: model
      )

      normalized = normalize(raw, lat: lat, lon: lon)
      Rails.cache.write(cache_key, normalized, expires_in: 30.minutes)
      normalized
    end


    def self.request(lat:, lon:, parameters: DEFAULT_PARAMETERS, model: DEFAULT_MODEL, levels: DEFAULT_LEVELS)
      body = {
        lat: lat,
        lon: lon,
        model: model,
        parameters: parameters,
        levels: levels,
        key: ENV.fetch("WINDY_API_KEY")
      }

      http = Net::HTTP.new(ENDPOINT.host, ENDPOINT.port)
      http.use_ssl = true

      request = Net::HTTP::Post.new(
        ENDPOINT,
        { "Content-Type" => "application/json" }
      )
      request.body = body.to_json

      response = http.request(request)

      

      unless response.is_a?(Net::HTTPSuccess)
        raise "Windy API error: #{response.code} #{response.body}"
      end

      JSON.parse(response.body)
    end

    def self.normalize(raw, lat:, lon:)
      raw["ts"].each_with_index.map do |ts, i|
        u = raw["wind_u-surface"][i]
        v = raw["wind_v-surface"][i]

        {
          lat: lat,
          lon: lon,
          timestamp: Time.at(ts / 1000).utc.iso8601,
          wind: {
            speed: wind_speed(u, v).round(2),
            direction: wind_direction(u, v).round
          },
          pressure: raw["pressure-surface"][i].round,
          humidity: raw["rh-surface"][i].round(1)
        }
      end
    end

    def self.wind_speed(u, v)
      Math.sqrt(u**2 + v**2)
    end

    def self.wind_direction(u, v)
      (Math.atan2(u, v) * 180 / Math::PI + 180) % 360
    end

    def self.windy_cache_key(lat, lon, model, parameters, levels)
      # round coordinates to 1km precision
      "windy:#{lat.to_f.round(2)}:#{lon.to_f.round(2)}:#{model}:#{parameters.sort.join(',')}:#{levels.sort.join(',')}"
    end
  end
end