package server

import (
	"github.com/aliamerj/meshstream/api/handlers"
	"github.com/labstack/echo/v5"
)

func (s *Server) CreateRoutes(e *echo.Echo) {
	hand := handlers.New(s.DB, s.Config)

	api := e.Group("/api")
	{
		hand.AddFilesEndPoints(api)
	}

}
