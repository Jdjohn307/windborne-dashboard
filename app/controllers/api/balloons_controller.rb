module Api
  class BalloonsController < ApplicationController
    def index
      data = Windborne::WindborneClient.new.fetch_last_24_hours
      render json: data
    end
  end
end