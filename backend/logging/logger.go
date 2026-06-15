package logging

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"sync"
	"time"
)

// Log levels
type Level int

const (
	LevelDebug Level = iota
	LevelInfo
	LevelWarn
	LevelError
)

func (l Level) String() string {
	switch l {
	case LevelDebug:
		return "DEBUG"
	case LevelInfo:
		return "INFO"
	case LevelWarn:
		return "WARN"
	case LevelError:
		return "ERROR"
	default:
		return "UNKNOWN"
	}
}

// logEntry is the JSON structure for every log line.
type logEntry struct {
	Timestamp string `json:"timestamp"`
	Level     string `json:"level"`
	App       string `json:"app"`
	Caller    string `json:"caller"`
	Message   string `json:"message"`
	Fields    any    `json:"fields,omitempty"`
}

// Logger is a structured JSON logger that writes to a file and stdout.
// Clears the log file on first initialization (app startup).
type Logger struct {
	mu       sync.Mutex
	file     *os.File
	appName  string
	toStdout bool
}

var (
	defaultLogger *Logger
	once          sync.Once
)

// Init initializes the default logger. Clears the log file on startup.
// Logs go to both the file and stdout (optional).
func Init(appName string, logDir string, logToStdout bool) error {
	var initErr error
	once.Do(func() {
		if err := os.MkdirAll(logDir, 0755); err != nil {
			initErr = fmt.Errorf("failed to create log directory %s: %w", logDir, err)
			return
		}

		logFile := filepath.Join(logDir, appName+".log")

		f, initErr := os.OpenFile(logFile, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0644)
		if initErr != nil {
			initErr = fmt.Errorf("failed to open log file %s: %w", logFile, initErr)
			return
		}

		defaultLogger = &Logger{
			file:     f,
			appName:  appName,
			toStdout: logToStdout,
		}

		hostname, _ := os.Hostname()
		defaultLogger.Log(LevelInfo, "Logger initialized",
			"logFile", logFile,
			"hostname", hostname,
			"pid", os.Getpid(),
		)
	})
	return initErr
}

// GetLogger returns the default logger. Must call Init first.
func GetLogger() *Logger {
	if defaultLogger == nil {
		panic("logging.Init() must be called before GetLogger()")
	}
	return defaultLogger
}

// toJSON converts the structured log data into a JSON string.
// This is a helper that always produces valid JSON, never panics.
func toJSON(ts, level, app, caller, message string, fields []any) string {
	entry := logEntry{
		Timestamp: ts,
		Level:     level,
		App:       app,
		Caller:    caller,
		Message:   message,
	}

	// Convert key-value fields slice to a map
	if len(fields) > 0 {
		m := make(map[string]any, len(fields)/2)
		for i := 0; i < len(fields); i += 2 {
			key := fmt.Sprintf("%v", fields[i])
			var val any = ""
			if i+1 < len(fields) {
				val = fields[i+1]
			}
			m[key] = val
		}
		entry.Fields = m
	}

	b, err := json.Marshal(entry)
	if err != nil {
		// Fallback if JSON serialization fails (should never happen)
		return fmt.Sprintf(`{"timestamp":"%s","level":"%s","app":"%s","caller":"%s","message":"json marshal error: %v"}`,
			ts, level, app, caller, err)
	}
	return string(b)
}

// Log writes a structured JSON log entry.
func (l *Logger) Log(level Level, message string, fields ...any) {
	l.mu.Lock()
	defer l.mu.Unlock()

	ts := time.Now().UTC().Format("2006-01-02T15:04:05.000Z")
	levelStr := level.String()

	// Caller info
	caller := ""
	if _, file, line, ok := runtime.Caller(2); ok {
		caller = fmt.Sprintf("%s:%d", filepath.Base(file), line)
	}

	entry := toJSON(ts, levelStr, l.appName, caller, message, fields)
	entry += "\n"

	// Write to file
	if l.file != nil {
		if _, err := l.file.WriteString(entry); err != nil {
			fmt.Fprintf(os.Stderr, "LOG WRITE ERROR: %v\n", err)
		}
	}

	// Also write to stdout for development
	if l.toStdout {
		fmt.Print(entry)
	}
}

// Convenience methods
func (l *Logger) Debug(message string, fields ...any) {
	l.Log(LevelDebug, message, fields...)
}

func (l *Logger) Info(message string, fields ...any) {
	l.Log(LevelInfo, message, fields...)
}

func (l *Logger) Warn(message string, fields ...any) {
	l.Log(LevelWarn, message, fields...)
}

func (l *Logger) Error(message string, fields ...any) {
	l.Log(LevelError, message, fields...)
}

// RedirectStdLog captures Go's standard log package into our logger.
func RedirectStdLog() {
	if defaultLogger == nil {
		return
	}
	log.SetOutput(logWriter{})
	log.SetFlags(0)
}

type logWriter struct{}

func (w logWriter) Write(p []byte) (n int, err error) {
	msg := strings.TrimRight(string(p), "\n")
	if defaultLogger != nil {
		defaultLogger.Log(LevelInfo, msg, "source", "stdlog")
	}
	return len(p), nil
}

// Sync ensures all buffered log data is written to disk.
func Sync() {
	if defaultLogger != nil && defaultLogger.file != nil {
		defaultLogger.file.Sync()
	}
}

// Close closes the log file.
func Close() {
	if defaultLogger != nil && defaultLogger.file != nil {
		defaultLogger.file.Close()
	}
}

// MultiWriter returns an io.Writer that writes to both our log file and stdout.
func MultiWriter() io.Writer {
	if defaultLogger != nil && defaultLogger.file != nil {
		return io.MultiWriter(defaultLogger.file, os.Stdout)
	}
	return os.Stdout
}
