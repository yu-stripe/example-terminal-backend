import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_URL } from '../index.js';

const TerminalContext = createContext();

export const useTerminal = () => {
  const context = useContext(TerminalContext);
  if (!context) {
    throw new Error('useTerminal must be used within a TerminalProvider');
  }
  return context;
};

export const TerminalProvider = ({ children }) => {
  const [selectedTerminal, setSelectedTerminal] = useState(null);
  const [terminalReader, setTerminalReader] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load terminal from localStorage and sync with server
  useEffect(() => {
    loadSelectedTerminal();
  }, []);

  const loadSelectedTerminal = async () => {
    try {
      setLoading(true);
      setError(null);

      // First try to get from localStorage
      const localTerminalId = localStorage.getItem('selectedTerminalId');

      // Then sync with server
      const response = await fetch(`${API_URL}/api/terminal/selected`);
      if (response.ok) {
        const data = await response.json();
        const serverTerminalId = data.reader_id;
        const readerData = data.reader;

        if (serverTerminalId) {
          // Server has a terminal selected
          setSelectedTerminal(serverTerminalId);
          setTerminalReader(readerData);
          // Update localStorage to match server
          localStorage.setItem('selectedTerminalId', serverTerminalId);
        } else if (localTerminalId) {
          // No server selection but localStorage has one - sync to server
          try {
            await selectTerminalOnServer(localTerminalId);
            const reader = await getTerminalReader(localTerminalId);
            setSelectedTerminal(localTerminalId);
            setTerminalReader(reader);
          } catch (err) {
            console.error('Failed to restore terminal from localStorage:', err);
            // Keep localStorage but show as not selected until manual selection
            setSelectedTerminal(null);
            setTerminalReader(null);
          }
        } else {
          // No terminal selected anywhere
          setSelectedTerminal(null);
          setTerminalReader(null);
        }
      } else if (localTerminalId) {
        // Server error but we have local storage - try to sync
        try {
          await selectTerminalOnServer(localTerminalId);
          const reader = await getTerminalReader(localTerminalId);
          setSelectedTerminal(localTerminalId);
          setTerminalReader(reader);
        } catch (err) {
          console.error('Failed to restore terminal from localStorage:', err);
          // Keep the terminal ID in localStorage for retry on next load
          setSelectedTerminal(null);
          setTerminalReader(null);
        }
      } else {
        // No terminal selected anywhere
        setSelectedTerminal(null);
        setTerminalReader(null);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error loading selected terminal:', err);
      // If there's an error but we have localStorage, try to use it
      const localTerminalId = localStorage.getItem('selectedTerminalId');
      if (localTerminalId) {
        setSelectedTerminal(localTerminalId);
      }
    } finally {
      setLoading(false);
    }
  };

  const selectTerminal = async (terminalId) => {
    try {
      setLoading(true);
      setError(null);

      // Update server
      await selectTerminalOnServer(terminalId);
      
      // Update local state
      setSelectedTerminal(terminalId);
      
      // Get reader details
      const reader = await getTerminalReader(terminalId);
      setTerminalReader(reader);

      // Update localStorage
      localStorage.setItem('selectedTerminalId', terminalId);

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const clearTerminal = async () => {
    try {
      setLoading(true);
      setError(null);

      // Clear from server
      const response = await fetch(`${API_URL}/api/terminal/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear terminal selection');
      }

      // Clear local state
      setSelectedTerminal(null);
      setTerminalReader(null);

      // Clear localStorage
      localStorage.removeItem('selectedTerminalId');

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const selectTerminalOnServer = async (terminalId) => {
    const response = await fetch(`${API_URL}/api/terminal/select`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reader_id: terminalId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || 'Failed to select terminal');
    }

    return response.json();
  };

  const getTerminalReader = async (terminalId) => {
    try {
      const response = await fetch(`${API_URL}/api/terminal/${terminalId}`);
      if (response.ok) {
        return response.json();
      }
    } catch (err) {
      console.warn('Could not fetch terminal reader details:', err);
    }
    return null;
  };

  const refreshTerminal = () => {
    loadSelectedTerminal();
  };

  const value = {
    selectedTerminal,
    terminalReader,
    loading,
    error,
    selectTerminal,
    clearTerminal,
    refreshTerminal,
    isTerminalSelected: !!selectedTerminal,
  };

  return (
    <TerminalContext.Provider value={value}>
      {children}
    </TerminalContext.Provider>
  );
}; 