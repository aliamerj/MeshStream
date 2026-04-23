package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/aliamerj/meshstream/types"
	"github.com/labstack/echo/v5"
)

func (c Config) AddFilesEndPoints(g *echo.Group) {
	files := g.Group("/files")
	files.GET("", c.getAllFiles)
}

func (c *Config) getAllFiles(eCtx *echo.Context) error {
	reqPath := eCtx.QueryParamOr("path", "/")
	fullPath, cleanRelPath, err := c.resolve(reqPath)
	if err != nil {
		return withErr(eCtx, err)
	}

	info, err := os.Stat(fullPath)
	if err != nil {
		return withErr(eCtx, err)
	}

	if !info.IsDir() {
		return withErr(eCtx, fmt.Errorf("path is not a directory"))
	}

	items, err := os.ReadDir(fullPath)
	if err != nil {
		return withErr(eCtx, err)
	}

	entries := make([]types.FileEntry, 0, len(items))

	for _, item := range items {

		if item.Type()&os.ModeSymlink != 0 {
			continue
		}

		itemInfo, err := item.Info()
		if err != nil {
			return withErr(eCtx, err)
		}

		itemRelPath := filepath.ToSlash(filepath.Join(cleanRelPath, item.Name()))
		if !strings.HasPrefix(itemRelPath, "/") {
			itemRelPath = "/" + itemRelPath
		}

		size := itemInfo.Size()
		if item.IsDir() {
			size = 0
		}

		entries = append(entries, types.FileEntry{
			Name:       item.Name(),
			Path:       itemRelPath,
			IsDir:      item.IsDir(),
			Size:       size,
			ModifiedAt: itemInfo.ModTime(),
		})

	}

	return eCtx.JSON(http.StatusOK, types.FileListResponse{
		Path:    cleanRelPath,
		Entries: entries,
	})
}

func (c *Config) resolve(relPath string) (fullPath string, cleanRelPath string, err error) {
	if relPath == "" {
		relPath = "/"
	}

	rootAbs, err := filepath.Abs(c.Config.Root)
	if err != nil {
		return "", "", fmt.Errorf("resolve root: %w", err)
	}

	cleanRelPath = filepath.Clean("/" + relPath)
	trimmed := strings.TrimPrefix(cleanRelPath, "/")

	fullPath = filepath.Join(rootAbs, trimmed)
	fullPath, err = filepath.Abs(fullPath)
	if err != nil {
		return "", "", fmt.Errorf("resolve path: %w", err)
	}

	if fullPath != rootAbs && !strings.HasPrefix(fullPath, rootAbs+string(os.PathSeparator)) {
		return "", "", fmt.Errorf("path escapes configured root")
	}

	return fullPath, cleanRelPath, nil
}
