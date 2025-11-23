export type MicStatus = "idle" | "listening" | "waiting";

interface MicControlProps {
  status: MicStatus;
  isEnabled: boolean;
  countdown: number;
  intervalDuration: number;
  onToggle: () => void;
  error: string | null;
}

const MicControl: React.FC<MicControlProps> = ({
  status,
  isEnabled,
  countdown,
  intervalDuration,
  onToggle,
  error,
}) => {
  const getStatusText = () => {
    if (!isEnabled) return "Microphone Off";
    switch (status) {
      case "listening":
        return "Listening for Malayalam…";
      case "waiting":
        return `Next listen in ${countdown}s`;
      default:
        return "Ready";
    }
  };

  const getStatusColor = () => {
    if (!isEnabled) return "#666";
    switch (status) {
      case "listening":
        return "#4caf50";
      case "waiting":
        return "#ff9800";
      default:
        return "#666";
    }
  };

  const progressPercent =
    status === "waiting" && intervalDuration > 0
      ? ((intervalDuration - countdown) / intervalDuration) * 100
      : status === "listening"
      ? 100
      : 0;

  return (
    <div
      style={{
        padding: "15px",
        backgroundColor: "#1a1a2e",
        borderRadius: "12px",
        marginBottom: "15px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Mic icon indicator */}
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: getStatusColor(),
              boxShadow:
                status === "listening"
                  ? `0 0 10px ${getStatusColor()}`
                  : "none",
              animation:
                status === "listening" ? "pulse 1.5s infinite" : "none",
            }}
          />
          <span style={{ color: getStatusColor(), fontWeight: 500 }}>
            {getStatusText()}
          </span>
        </div>

        {/* Toggle button */}
        <button
          onClick={onToggle}
          style={{
            padding: "8px 20px",
            borderRadius: "20px",
            border: "none",
            backgroundColor: isEnabled ? "#ef5350" : "#4caf50",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          {isEnabled ? "Stop" : "Start"} Mic
        </button>
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: "6px",
          backgroundColor: "#333",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPercent}%`,
            backgroundColor: status === "listening" ? "#4caf50" : "#ff9800",
            borderRadius: "3px",
            transition: status === "listening" ? "none" : "width 1s linear",
          }}
        />
      </div>

      {/* Error display */}
      {error && (
        <p style={{ color: "#ef5350", marginTop: "10px", marginBottom: 0 }}>
          {error}
        </p>
      )}

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default MicControl;
