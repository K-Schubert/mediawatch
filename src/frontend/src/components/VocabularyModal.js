import React from 'react';
import styled from 'styled-components';
import { customTheme } from '../styles/theme';
import { CSVLink } from 'react-csv';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContent = styled.div`
  background-color: ${customTheme.colors.surface};
  padding: ${customTheme.spacing.lg};
  border-radius: ${customTheme.borderRadius.md};
  width: 80%;
  max-width: 600px;
  max-height: 80%;
  overflow-y: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th, td {
    border: 1px solid ${customTheme.colors.border};
    padding: ${customTheme.spacing.sm};
    text-align: left;
  }

  th {
    background-color: ${customTheme.colors.background};
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  float: right;
  cursor: pointer;
`;

const ExportButton = styled.button`
  background-color: ${customTheme.colors.primary};
  color: ${customTheme.colors.onPrimary};
  border: none;
  padding: ${customTheme.spacing.sm};
  border-radius: ${customTheme.borderRadius.sm};
  cursor: pointer;
  margin-bottom: ${customTheme.spacing.md};
`;

function VocabularyModal({ isOpen, onClose, data }) {
  if (!isOpen) return null;

  const headers = [
    { label: "N-Gram", key: "term" },
    { label: "Count", key: "count" },
    { label: "Category", key: "category" },
    { label: "Description", key: "description" }
  ];

  return (
    <ModalOverlay>
      <ModalContent>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        <h2>Vocabulary Analysis</h2>
        <CSVLink data={data} headers={headers} filename={"vocabulary_analysis.csv"}>
          <ExportButton>Export CSV</ExportButton>
        </CSVLink>
        <Table>
          <thead>
            <tr>
              <th>N-Gram</th>
              <th>Count</th>
              <th>Category</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index}>
                <td>{item.term}</td>
                <td>{item.count}</td>
                <td>{item.category}</td>
                <td>{item.description}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </ModalContent>
    </ModalOverlay>
  );
}

export default VocabularyModal;
