import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoPersonOutline, IoLockClosedOutline, IoEyeOutline, IoEyeOffOutline } from 'react-icons/io5';
import Styles from './Formulario.module.css';
import AuthService from '../services/authService';

const LoginAdmin = () => {
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await AuthService.loginAdmin(formData.email, formData.senha);
      const adminName = response?.user?.nome || response?.nome || response?.name || 'Administrador';
      const adminId = response?.user?.id || response?.id || '';
      localStorage.setItem('userType', 'admin');
      localStorage.setItem('adminName', adminName);
      if (adminId) localStorage.setItem('adminId', String(adminId));
      navigate('/docelivery/admin/dashboard');
    } catch (err) {
      alert('Credenciais inválidas ou erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={Styles.container}>
      <div className={Styles.formContainer}>
        <div className={Styles.header}>
          <h1>Acesso Administrativo</h1>
          <p>Faça login para acessar o painel de administração</p>
        </div>

        <form onSubmit={handleSubmit} className={Styles.form}>
          <div className={Styles.inputGroup}>
            <IoPersonOutline className={Styles.inputIcon} />
            <input
              type="email"
              name="email"
              placeholder="Email do administrador"
              value={formData.email}
              onChange={handleChange}
              className={Styles.input}
              required
            />
          </div>

          <div className={Styles.inputGroup}>
            <IoLockClosedOutline className={Styles.inputIcon} />
            <input
              type={showPassword ? 'text' : 'password'}
              name="senha"
              placeholder="Senha"
              value={formData.senha}
              onChange={handleChange}
              className={Styles.input}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={Styles.passwordToggle}
            >
              {showPassword ? <IoEyeOffOutline /> : <IoEyeOutline />}
            </button>
          </div>

          <button 
            type="submit" 
            className={Styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar como Admin'}
          </button>
        </form>


      </div>
    </div>
  );
};

export default LoginAdmin;