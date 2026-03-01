import { useRef, useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { QRCodeCanvas } from "qrcode.react";

const ERROR_LEVELS = ["L", "M", "Q", "H"] as const;

function App() {
  const [text, setText] = useState("");
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [errorLevel, setErrorLevel] =
    useState<(typeof ERROR_LEVELS)[number]>("M");
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleDownload = async () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "qrcode.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] });
      } else {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "qrcode.png";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }
    }, "image/png");
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        QR Code Generator
      </Typography>

      <Stack spacing={3}>
        <TextField
          label="Enter text or URL"
          multiline
          minRows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          fullWidth
        />

        <Box>
          <Typography gutterBottom>
            Size: {size}px
          </Typography>
          <Slider
            value={size}
            onChange={(_, v) => setSize(v as number)}
            min={128}
            max={512}
            step={8}
          />
        </Box>

        <Stack direction="row" spacing={2}>
          <TextField
            label="Foreground"
            type="color"
            value={fgColor}
            onChange={(e) => setFgColor(e.target.value)}
            sx={{ width: 120 }}
          />
          <TextField
            label="Background"
            type="color"
            value={bgColor}
            onChange={(e) => setBgColor(e.target.value)}
            sx={{ width: 120 }}
          />
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Error Level</InputLabel>
            <Select
              value={errorLevel}
              label="Error Level"
              onChange={(e) =>
                setErrorLevel(
                  e.target.value as (typeof ERROR_LEVELS)[number],
                )
              }
            >
              {ERROR_LEVELS.map((lvl) => (
                <MenuItem key={lvl} value={lvl}>
                  {lvl}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>

        <Paper
          elevation={2}
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            p: 3,
            minHeight: size + 48,
          }}
        >
          {text ? (
            <div ref={canvasRef}>
              <QRCodeCanvas
                value={text}
                size={size}
                fgColor={fgColor}
                bgColor={bgColor}
                level={errorLevel}
              />
            </div>
          ) : (
            <Typography color="text.secondary">
              Type something above to generate a QR code
            </Typography>
          )}
        </Paper>

        <Button
          variant="contained"
          onClick={handleDownload}
          disabled={!text}
          size="large"
        >
          Save QR Code
        </Button>
      </Stack>
    </Container>
  );
}

export default App;
