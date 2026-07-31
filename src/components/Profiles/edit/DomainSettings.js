import React from 'react';
import styled from 'styled-components';

const Container = styled.div`
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin-bottom: 20px;
  font-size: 24px;
  color: var(--text);
`;

const FormGroup = styled.div`
  margin-bottom: 15px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 16px;
  color: var(--text-muted);
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  font-size: 16px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  outline: none;
  transition: border-color 0.3s;

  &:focus {
    border-color: var(--accent);
    box-shadow: var(--focus-ring);
  }
`;

const AddButton = styled.button`
  padding: 10px 20px;
  font-size: 16px;
  color: white;
  background-color: var(--accent);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    background-color: var(--accent-hover);
  }
`;

const RemoveButton = styled.button`
  padding: 5px 10px;
  font-size: 14px;
  color: white;
  background-color: var(--bad);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  margin-top: 10px;

  &:hover {
    filter: brightness(0.88);
  }
`;

const DomainSettings = ({ settings, setSettings }) => {
  const handleAddDomain = () => {
    const newDomain = {
      EmailDomains: [''],
      WebDomains: [''],
      PayloadDescription: 'Configures Managed Domains',
      PayloadDisplayName: 'Domains',
      PayloadType: 'com.apple.domains',
    };
    setSettings({
      ...settings,
      domains: [...(settings.domains || []), newDomain],
    });
  };

  const handleRemoveDomain = (index) => {
    const updatedDomains = settings.domains.filter((domain, i) => i !== index);
    setSettings({
      ...settings,
      domains: updatedDomains,
    });
  };

  const handleInputChange = (domainIndex, type, index, value) => {
    const updatedDomains = settings.domains.map((domain, i) =>
      i === domainIndex
        ? {
            ...domain,
            [type]: domain[type].map((item, j) =>
              j === index ? value : item
            ),
          }
        : domain
    );
    setSettings({
      ...settings,
      domains: updatedDomains,
    });
  };

  const handleAddDomainEntry = (domainIndex, type) => {
    const updatedDomains = settings.domains.map((domain, i) =>
      i === domainIndex
        ? {
            ...domain,
            [type]: [...domain[type], ''],
          }
        : domain
    );
    setSettings({
      ...settings,
      domains: updatedDomains,
    });
  };

  const handleRemoveDomainEntry = (domainIndex, type, index) => {
    const updatedDomains = settings.domains.map((domain, i) =>
      i === domainIndex
        ? {
            ...domain,
            [type]: domain[type].filter((_, j) => j !== index),
          }
        : domain
    );
    setSettings({
      ...settings,
      domains: updatedDomains,
    });
  };

  return (
    <Container>
      <Title>Domain Settings</Title>
      {settings.domains?.map((domain, domainIndex) => (
        <Container key={domainIndex}>
          <FormGroup>
            <Label>Payload Description:</Label>
            <Input
              type="text"
              value={domain.PayloadDescription || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  domains: settings.domains.map((d, i) =>
                    i === domainIndex
                      ? { ...d, PayloadDescription: e.target.value }
                      : d
                  ),
                })
              }
            />
          </FormGroup>
          <FormGroup>
            <Label>Payload Display Name:</Label>
            <Input
              type="text"
              value={domain.PayloadDisplayName || ''}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  domains: settings.domains.map((d, i) =>
                    i === domainIndex
                      ? { ...d, PayloadDisplayName: e.target.value }
                      : d
                  ),
                })
              }
            />
          </FormGroup>
          <FormGroup>
            <Label>Email Domains:</Label>
            {domain.EmailDomains?.map((emailDomain, index) => (
              <Container key={index}>
                <Input
                  type="text"
                  value={emailDomain}
                  onChange={(e) =>
                    handleInputChange(domainIndex, 'EmailDomains', index, e.target.value)
                  }
                />
                <RemoveButton
                  onClick={() =>
                    handleRemoveDomainEntry(domainIndex, 'EmailDomains', index)
                  }
                >
                  Remove Email Domain
                </RemoveButton>
              </Container>
            ))}
            <AddButton onClick={() => handleAddDomainEntry(domainIndex, 'EmailDomains')}>
              Add Email Domain
            </AddButton>
          </FormGroup>
          <FormGroup>
            <Label>Web Domains:</Label>
            {domain.WebDomains?.map((webDomain, index) => (
              <Container key={index}>
                <Input
                  type="text"
                  value={webDomain}
                  onChange={(e) =>
                    handleInputChange(domainIndex, 'WebDomains', index, e.target.value)
                  }
                />
                <RemoveButton
                  onClick={() =>
                    handleRemoveDomainEntry(domainIndex, 'WebDomains', index)
                  }
                >
                  Remove Web Domain
                </RemoveButton>
              </Container>
            ))}
            <AddButton onClick={() => handleAddDomainEntry(domainIndex, 'WebDomains')}>
              Add Web Domain
            </AddButton>
          </FormGroup>
          <RemoveButton onClick={() => handleRemoveDomain(domainIndex)}>
            Remove Domain Configuration
          </RemoveButton>
        </Container>
      ))}
      <AddButton onClick={handleAddDomain}>Add Domain Configuration</AddButton>
    </Container>
  );
};

export default DomainSettings;
