package server

import (
	"net/http"
	"time"

	"github.com/aliamerj/meshstream/api/database"
	"github.com/aliamerj/meshstream/config"
)

type Server struct {
	addr   string
	db     database.Service
	config config.Config
}

func NewServer(cfg config.Config, dburl string) (*Server, *http.Server, error) {
	db, err := database.New(dburl)
	if err != nil {
		return nil, nil, err
	}

	srv := &Server{
		addr:   cfg.Addr,
		db:     db,
		config: cfg,
	}

	httpServer := &http.Server{
		Addr:         cfg.Addr,
		Handler:      srv.RegisterRoutes(),
		IdleTimeout:  time.Minute,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	return srv, httpServer, nil
}

func (s *Server) Close() error {
	if s.db != nil {
		return s.db.Close()
	}
	return nil
}

