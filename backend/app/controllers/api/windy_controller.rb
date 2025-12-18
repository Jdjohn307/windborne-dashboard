module Api
  class WindyController < ApplicationController
    def forecast
      data = Windy::WindyClient.forecast(
        lat: params[:lat],
        lon: params[:lon]
      )

      render json: {
        meta: {
          source: "Windy",
          units: {
            wind_speed: "m/s",
            pressure: "Pa",
            humidity: "%"
          }
        },
        data: data
      }
    end
  end
end