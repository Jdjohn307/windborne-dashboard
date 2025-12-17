# app/services/windborne_client.rb
require 'net/http'
require 'json'

module Windborne
  class WindborneClient
    BASE_URL = "https://a.windbornesystems.com/treasure"

    def fetch_last_24_hours
      (0..23).map do |hour|
        positions = fetch_hour(hour)
        # Rails.logger.info "Hour #{hour}, positions count: #{positions&.size}"
        {
          hour_ago: hour,
          positions: positions
        }
      end.compact
    end


    private

    def fetch_hour(hour)
      url = URI("#{BASE_URL}/#{format('%02d', hour)}.json")
      response = Net::HTTP.get_response(url)

      return nil unless response.is_a?(Net::HTTPSuccess)

      body = JSON.parse(response.body)
      body.filter_map { |position| normalize(position) }
    rescue JSON::ParserError => e
      nil
    rescue StandardError => e
      nil
    end

    def normalize(position)
      # Basic avoidance of corrupted data
      return unless position.is_a?(Array) && position.size == 3
      
      {
        latitude: position[0],
        longitude: position[1],
        altitude_km: position[2]
      }
    end
  end
end
