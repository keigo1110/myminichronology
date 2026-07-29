'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { CopyableAlert } from './CopyableAlert';
import { LocaleContext } from '../i18n/LocaleProvider';

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
      message: error.message || '',
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
        <LocaleContext.Consumer>
          {({ t }) => {
            const detail = this.state.message || t('error.boundaryFallback');
            return (
              <Box
                component="main"
                sx={{
                  minHeight: '100vh',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 3,
                  backgroundColor: 'background.default',
                }}
              >
                <Box sx={{ maxWidth: 480, width: '100%' }}>
                  <CopyableAlert
                    severity="error"
                    kind="error"
                    messages={[detail]}
                    sx={{ mb: 2 }}
                  >
                    {t('error.boundaryTitle')}
                  </CopyableAlert>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {detail || t('error.unexpected')}
                  </Typography>
                  <Button variant="contained" onClick={this.handleReload}>
                    {t('error.reload')}
                  </Button>
                </Box>
              </Box>
            );
          }}
        </LocaleContext.Consumer>
      );
    }

    return this.props.children;
  }
}
