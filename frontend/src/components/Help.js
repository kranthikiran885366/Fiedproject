import React from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Button,
  Grid,
  Link,
  Divider
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  Face as FaceIcon,
  QrCode as QrCodeIcon,
  LocationOn as LocationIcon,
  Videocam as VideocamIcon,
  Psychology as PsychologyIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

const helpSections = [
  {
    title: 'Getting Started',
    icon: <HelpIcon />,
    content: [
      {
        question: 'How do I mark my attendance?',
        answer: 'You can mark your attendance using any of these methods:\n1. Face Recognition\n2. QR Code Scanning\n3. Location Verification\nMake sure you are within the designated area and during the active session time.'
      },
      {
        question: 'What should I do if my attendance is not marked?',
        answer: 'If your attendance is not marked, you can:\n1. Try another attendance method\n2. Contact your faculty\n3. Submit a correction request'
      }
    ]
  },
  {
    title: 'Face Recognition',
    icon: <FaceIcon />,
    content: [
      {
        question: 'How does face recognition work?',
        answer: 'Face recognition uses your device\'s camera to verify your identity. Make sure you are in a well-lit area and your face is clearly visible.'
      },
      {
        question: 'What if face recognition fails?',
        answer: 'If face recognition fails:\n1. Ensure proper lighting\n2. Remove face coverings\n3. Try updating your profile photo\n4. Use alternative attendance methods'
      }
    ]
  },
  {
    title: 'QR Code Scanning',
    icon: <QrCodeIcon />,
    content: [
      {
        question: 'Where do I find the QR code?',
        answer: 'QR codes are displayed by faculty during class sessions. They may be shown on a screen or printed.'
      },
      {
        question: 'How do I scan the QR code?',
        answer: '1. Click on "QR Scanner" in the attendance menu\n2. Allow camera access\n3. Point your camera at the QR code\n4. Hold steady until the code is recognized'
      }
    ]
  },
  {
    title: 'Location Verification',
    icon: <LocationIcon />,
    content: [
      {
        question: 'Why is location required?',
        answer: 'Location verification ensures you are physically present in the class or designated area.'
      },
      {
        question: 'How to enable location services?',
        answer: '1. Check browser settings\n2. Enable location services on your device\n3. Allow location access when prompted'
      }
    ]
  },
  {
    title: 'CCTV Monitoring',
    icon: <VideocamIcon />,
    content: [
      {
        question: 'How does CCTV monitoring work?',
        answer: 'CCTV cameras use AI to monitor classroom attendance and student engagement. The system respects privacy and only tracks attendance-related metrics.'
      },
      {
        question: 'What data is collected?',
        answer: 'The system collects:\n1. Presence/absence data\n2. Engagement metrics\n3. Class participation statistics\nNo personal conversations or private activities are recorded.'
      }
    ]
  },
  {
    title: 'Emotion & Behavior Analysis',
    icon: <PsychologyIcon />,
    content: [
      {
        question: 'What is emotion tracking?',
        answer: 'The system analyzes facial expressions to understand student engagement and emotional state during classes.'
      },
      {
        question: 'How is the data used?',
        answer: 'The data helps faculty:\n1. Identify struggling students\n2. Improve teaching methods\n3. Provide better support\nAll data is anonymized and used only for educational improvement.'
      }
    ]
  },
  {
    title: 'Reports & Analytics',
    icon: <AssessmentIcon />,
    content: [
      {
        question: 'How to view my attendance report?',
        answer: '1. Go to the Analytics section\n2. Select date range\n3. View detailed attendance statistics\n4. Download reports if needed'
      },
      {
        question: 'What do the analytics show?',
        answer: 'Analytics include:\n1. Attendance percentage\n2. Attendance patterns\n3. Class engagement metrics\n4. Comparative statistics'
      }
    ]
  }
];

const Help = () => {
  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Help Center
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to the Automated Attendance System help center. Find answers to common questions and learn how to use the system effectively.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          href="mailto:support@attendance.com"
          sx={{ mt: 2 }}
        >
          Contact Support
        </Button>
      </Paper>

      {helpSections.map((section, index) => (
        <Accordion key={index} sx={{ mb: 2 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '& .MuiAccordionSummary-expandIconWrapper': {
                color: 'primary.contrastText'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {section.icon}
              <Typography variant="h6">{section.title}</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {section.content.map((item, i) => (
              <Box key={i} sx={{ mb: i < section.content.length - 1 ? 3 : 0 }}>
                <Typography variant="subtitle1" color="primary" gutterBottom>
                  {item.question}
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
                  {item.answer}
                </Typography>
                {i < section.content.length - 1 && (
                  <Divider sx={{ my: 2 }} />
                )}
              </Box>
            ))}
          </AccordionDetails>
        </Accordion>
      ))}

      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Still need help?
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Link href="https://docs.attendance.com" target="_blank" underline="none">
              <Button variant="outlined" fullWidth>
                Documentation
              </Button>
            </Link>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Link href="https://support.attendance.com" target="_blank" underline="none">
              <Button variant="outlined" fullWidth>
                Support Portal
              </Button>
            </Link>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Help;
