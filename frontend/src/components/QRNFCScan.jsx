import React, { useState, useEffect } from "react";
import { Button, Container, Paper, Typography, Box, CircularProgress } from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useNavigate } from "react-router-dom";

const QRNFCScan = () => {
  const [qrData, setQrData] = useState(null);
  const [nfcData, setNfcData] = useState(null);
  const [error, setError] = useState("");
  const [loadingNFC, setLoadingNFC] = useState(false);
  const [generatedQR, setGeneratedQR] = useState(generateRandomQR());
  const [scanMessage, setScanMessage] = useState(""); // Success/Error message
  const navigate = useNavigate();

  // Function to generate a new QR Code
  function generateRandomQR() {
    return `ATTENDANCE-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }

  // Auto-refresh QR Code every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setGeneratedQR(generateRandomQR());
      setScanMessage(""); // Reset success/error message
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize QR Code Scanner (Only Once)
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
    scanner.render(
      (decodedText) => {
        setQrData(decodedText);
        console.log("QR Code Scanned:", decodedText);

        // Check if scanned QR matches the generated one
        if (decodedText === generatedQR) {
          setScanMessage("✅ Scanned Successfully!");
        } else {
          setScanMessage("❌ QR Code does not match.");
        }
      },
      (errorMessage) => {
        console.error("QR Scan Error:", errorMessage);
      }
    );

    return () => scanner.clear();
  }, []); // Initialize scanner only once

  // NFC Scan Function
  const handleNFCScan = async () => {
    setLoadingNFC(true);
    setError("");

    if ("NDEFReader" in window) {
      try {
        const ndef = new window.NDEFReader();
        await ndef.scan();
        console.log("NFC Scan Started");

        ndef.onreading = (event) => {
          const decoder = new TextDecoder();
          for (const record of event.message.records) {
            setNfcData(decoder.decode(record.data));
            console.log("NFC Data:", decoder.decode(record.data));
          }
        };
      } catch (error) {
        console.error("NFC Scan Error:", error);
        setError("NFC Scan failed. Please try again.");
      } finally {
        setLoadingNFC(false);
      }
    } else {
      setError("NFC scanning is not supported on this device.");
      setLoadingNFC(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ padding: 3, marginTop: 5, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          QR & NFC Attendance Capture
        </Typography>

        {/* QR Code Generator */}
        <Box sx={{ marginBottom: 3 }}>
          <Typography variant="h6">Generated QR Code</Typography>
          <QRCodeCanvas value={generatedQR} size={256} />
          <Typography variant="body1" sx={{ marginTop: 2 }}>
            {generatedQR}
          </Typography>
        </Box>

        {/* QR Code Scanner */}
        <Box sx={{ marginBottom: 3 }}>
          <Typography variant="h6">Scan QR Code</Typography>
          <div id="qr-reader" style={{ width: "100%" }}></div>
          {scanMessage && (
            <Typography color={scanMessage.includes("✅") ? "success.main" : "error.main"}>
              {scanMessage}
            </Typography>
          )}
        </Box>

        {/* NFC Scanner */}
        <Box sx={{ marginBottom: 3 }}>
          <Typography variant="h6">Scan NFC Card</Typography>
          <Button variant="contained" color="primary" onClick={handleNFCScan} disabled={loadingNFC}>
            {loadingNFC ? <CircularProgress size={24} /> : "Start NFC Scan"}
          </Button>
          {nfcData && <Typography color="success.main">Scanned NFC Data: {nfcData}</Typography>}
        </Box>

        {/* Error Handling */}
        {error && <Typography color="error.main">{error}</Typography>}
      </Paper>
    </Container>
  );
};

export default QRNFCScan;
