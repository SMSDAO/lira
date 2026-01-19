package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/smsdao/lira/internal/handlers"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment")
	}

	// Create Gin router
	r := gin.Default()

	// CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(200)
			return
		}

		c.Next()
	})

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "Go API",
		})
	})

	// API routes
	api := r.Group("/api")
	{
		// Agent execution endpoints
		agents := api.Group("/agents")
		{
			agents.GET("", handlers.GetAgents)
			agents.GET("/:id", handlers.GetAgent)
			agents.POST("", handlers.CreateAgent)
			agents.POST("/:id/execute", handlers.ExecuteAgent)
			agents.POST("/batch-execute", handlers.BatchExecuteAgents)
		}

		// Model endpoints
		models := api.Group("/models")
		{
			models.GET("", handlers.GetModels)
			models.GET("/:id", handlers.GetModel)
			models.POST("", handlers.CreateModel)
			models.PUT("/:id", handlers.UpdateModel)
		}

		// Quantum oracle endpoints
		quantum := api.Group("/quantum")
		{
			quantum.POST("/predict", handlers.QuantumPredict)
			quantum.GET("/status", handlers.QuantumStatus)
		}
	}

	// Start server
	port := os.Getenv("GO_PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting Go API server on port %s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
