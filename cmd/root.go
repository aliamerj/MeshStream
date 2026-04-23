package cmd

import (
	"os"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use: "meshstream",
	Short: `Browse and stream your personal files across devices over a private WireGuard mesh.
No cloud. No port forwarding. No exposure. Free forever.`,
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
