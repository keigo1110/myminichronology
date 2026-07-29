'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || '予期しないエラーが発生しました。',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          component="main"
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
          }}
        >
          <Box sx={{ maxWidth: 480, width: '100%' }}>
            <Alert severity="error" sx={{ mb: 2 }}>
              表示中にエラーが発生しました。ページを再読み込みしてください。
            </Alert>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {this.state.message}
            </Typography>
            <Button variant="contained" onClick={this.handleReload}>
              再読み込み
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
