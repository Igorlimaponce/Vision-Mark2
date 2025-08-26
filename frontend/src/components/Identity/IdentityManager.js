import React, { useState, useEffect, useCallback } from 'react';
import { getIdentities, createIdentity, deleteIdentity } from '../../services/api';
import './IdentityManager.css';

const IdentityManager = () => {
  const [identities, setIdentities] = useState([]);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newImageFile, setNewImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchIdentities = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getIdentities();
      setIdentities(data);
    } catch (err) {
      setError('Falha ao carregar identidades.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIdentities();
  }, [fetchIdentities]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewImageFile(file);
      // Cria a URL de pré-visualização da imagem
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const clearForm = () => {
    setNewName('');
    setNewDescription('');
    setNewImageFile(null);
    setImagePreview('');
    document.getElementById('image-file-input').value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newName || !newImageFile) {
      setError('Nome e Imagem são obrigatórios.');
      return;
    }
    
    // Usamos FormData para enviar arquivos multipart
    const formData = new FormData();
    formData.append('name', newName);
    formData.append('description', newDescription);
    formData.append('file', newImageFile);

    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await createIdentity(formData);
      setSuccessMessage(`Identidade "${newName}" criada com sucesso!`);
      clearForm();
      fetchIdentities(); // Recarrega a lista
    } catch (err) {
      // Exibe a mensagem de erro específica vinda da API
      setError(err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    // Modal de confirmação mais profissional (pode ser substituído por uma lib de UI)
    if (window.confirm(`Tem certeza que deseja deletar a identidade "${name}"? Esta ação é irreversível.`)) {
      try {
        await deleteIdentity(id);
        setSuccessMessage(`Identidade "${name}" deletada com sucesso.`);
        fetchIdentities();
      } catch (err) {
        setError(`Falha ao deletar a identidade "${name}".`);
      }
    }
  };
  
  // Limpa a URL do objeto de preview quando o componente é desmontado para evitar memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);


  return (
    <div className="identity-manager">
      <h2>Gerenciador de Identidades</h2>

      {error && <div className="message error-message">{error}</div>}
      {successMessage && <div className="message success-message">{successMessage}</div>}

      <div className="content-wrapper">
        <div className="form-container">
          <h3>Cadastrar Nova Identidade</h3>
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome da pessoa"
              required
            />
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Descrição (opcional)"
            />
            <input
              id="image-file-input"
              type="file"
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
              required
            />
            {imagePreview && (
              <div className="image-preview-container">
                <p>Pré-visualização:</p>
                <img src={imagePreview} alt="Pré-visualização" className="image-preview" />
              </div>
            )}
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>
        </div>

        <div className="list-container">
          <h3>Identidades Cadastradas</h3>
          {isLoading && identities.length === 0 ? (
            <p>Carregando...</p>
          ) : (
            <ul>
              {identities.map((identity) => (
                <li key={identity.id}>
                  <div className="identity-info">
                    <strong>{identity.name}</strong>
                    <p>{identity.description}</p>
                  </div>
                  <button onClick={() => handleDelete(identity.id, identity.name)} className="delete-btn">
                    Deletar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default IdentityManager;