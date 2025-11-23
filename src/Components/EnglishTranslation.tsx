interface EnglishTranslationProps {
  text: string | undefined;
  isLoading: boolean;
}

const EnglishTranslation: React.FC<EnglishTranslationProps> = ({
  text,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div style={{ marginTop: "10px", color: "#666" }}>
        <i>Translating...</i>
      </div>
    );
  }

  if (!text) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: "10px",
        padding: "10px",
        // marginBottom: "10px",
        backgroundColor: "#f0f7ff",
        borderRadius: "6px",
        borderLeft: "3px solid #007bff",
      }}
    >
      <p style={{ margin: 0, fontStyle: "italic", color: "#333" }}>{text}</p>
    </div>
  );
};

export default EnglishTranslation;
