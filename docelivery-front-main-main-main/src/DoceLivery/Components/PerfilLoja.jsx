// src/Components/PerfilLoja.jsx

import React, { useState, useEffect } from 'react';
import { IoSave, IoTime, IoImage, IoLocation, IoCall } from 'react-icons/io5';
import { useLoja } from '../context/LojaContext';
import ImageUploader from './ImageUploader';
import Styles from './PerfilLoja.module.css';
import confeiteiroService from '../services/confeiteiroService';

const PerfilLoja = ({ onUserDataUpdate }) => {
    const { dadosLoja, atualizarDadosLoja, atualizarHorarioFuncionamento } = useLoja();
    const [formData, setFormData] = useState({
        nome: dadosLoja.nome || '',
        email: dadosLoja.email || localStorage.getItem('userEmail') || '',
        telefone: dadosLoja.telefone || localStorage.getItem('userTelefone') || '',
        cnpj: dadosLoja.cnpj || localStorage.getItem('userCnpj') || '',
        cep: dadosLoja.cep || localStorage.getItem('userCep') || '',
        logradouro: dadosLoja.logradouro || '',
        numero: dadosLoja.numero || '',
        complemento: dadosLoja.complemento || '',
        bairro: dadosLoja.bairro || localStorage.getItem('userBairro') || '',
        cidade: dadosLoja.cidade || localStorage.getItem('userCidade') || '',
        estado: dadosLoja.estado || localStorage.getItem('userUf') || '',
        descricao: dadosLoja.descricao || '',
        imagem: dadosLoja.imagem || '',
    });
    const [horarios, setHorarios] = useState(dadosLoja.horarioFuncionamento);
    const [cepLoading, setCepLoading] = useState(false);

    useEffect(() => {
        const usuarioString = localStorage.getItem('dadosConfeiteiro');
        if (usuarioString) {
            const usuario = JSON.parse(usuarioString);
            console.log('Usuário recuperado:', usuario);
            setFormData(prev => ({
                ...prev,
                nome: usuario.nomeLoja || usuario.nomeConfeitaria || prev.nome,
                telefone: usuario.telefone || prev.telefone,
                cnpj: usuario.cnpj || prev.cnpj,
                cep: usuario.cep || prev.cep,
                logradouro: usuario.logradouro || prev.logradouro,
                numero: usuario.numero || prev.numero,
                complemento: usuario.complemento || prev.complemento,
                bairro: usuario.bairro || prev.bairro,
                cidade: usuario.cidade || prev.cidade,
                estado: usuario.estado || usuario.uf || prev.estado,
                email: usuario.email || prev.email,
            }));
        } else {
            console.warn('Nenhum dado de confeiteiro encontrado no localStorage');
        }
    }, []);

    const applyMask = (name, value) => {
        const digits = value.replace(/\D/g, '');
        if (name === 'telefone') {
            return digits.slice(0, 11)
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{5})(\d{1,4})$/, '$1-$2');
        }
        if (name === 'cnpj') {
            return digits.slice(0, 14)
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
        }
        if (name === 'cep') {
            return digits.slice(0, 8).replace(/(\d{5})(\d{1,3})$/, '$1-$2');
        }
        return value;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const masked = ['telefone', 'cnpj', 'cep'].includes(name) ? applyMask(name, value) : value;
        setFormData(prev => ({ ...prev, [name]: masked }));

        if (name === 'cep') {
            const digits = value.replace(/\D/g, '');
            if (digits.length === 8) {
                setCepLoading(true);
                fetch(`https://viacep.com.br/ws/${digits}/json/`)
                    .then(r => r.json())
                    .then(data => {
                        if (!data.erro) {
                            setFormData(prev => ({
                                ...prev,
                                logradouro: data.logradouro || '',
                                bairro: data.bairro || '',
                                cidade: data.localidade || '',
                                estado: data.uf || '',
                            }));
                        }
                    })
                    .finally(() => setCepLoading(false));
            }
        }
    };

    const handleHorarioChange = (dia, valor) => {
        setHorarios(prev => ({
            ...prev,
            [dia]: valor
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await confeiteiroService.atualizarPerfil(formData);
            atualizarDadosLoja({ ...formData });
            atualizarHorarioFuncionamento(horarios);
            if (onUserDataUpdate) {
                onUserDataUpdate({ nome: localStorage.getItem('userName') || formData.nome, loja: formData.nome });
            }
            alert('Perfil da loja atualizado com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            alert('Erro ao atualizar perfil. Verifique os dados e tente novamente.');
        }
    };


    const diasSemana = [
        { key: 'segunda', label: 'Segunda-feira' },
        { key: 'terca', label: 'Terça-feira' },
        { key: 'quarta', label: 'Quarta-feira' },
        { key: 'quinta', label: 'Quinta-feira' },
        { key: 'sexta', label: 'Sexta-feira' },
        { key: 'sabado', label: 'Sábado' },
        { key: 'domingo', label: 'Domingo' }
    ];

    return (
        <div className={Styles.perfilContainer}>
            <div className={Styles.header}>
                <h1>Perfil da Loja</h1>
                <p>Gerencie as informações da sua confeitaria</p>
            </div>

            <form onSubmit={handleSubmit} className={Styles.perfilForm}>
                <div className={Styles.section}>
                    <h2>
                        <IoLocation size={20} />
                        Informações Básicas
                    </h2>

                    <div className={Styles.formRow}>
                        <div className={Styles.formGroup}>
                            <label>Nome da Loja *</label>
                            <input
                                type="text"
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                placeholder="Nome da sua confeitaria"
                                required
                            />
                        </div>
                        <div className={Styles.formGroup}>
                            <label>CNPJ</label>
                            <input
                                type="text"
                                name="cnpj"
                                value={formData.cnpj}
                                onChange={handleChange}
                                placeholder="00.000.000/0000-00"
                                maxLength={18}
                            />
                        </div>
                    </div>

                    <div className={Styles.formRow}>
                        <div className={Styles.formGroup}>
                            <label>E-mail *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="contato@confeitaria.com"
                                required
                            />
                        </div>
                        <div className={Styles.formGroup}>
                            <label>Telefone *</label>
                            <input
                                type="tel"
                                name="telefone"
                                value={formData.telefone}
                                onChange={handleChange}
                                placeholder="(00) 00000-0000"
                                maxLength={15}
                                required
                            />
                        </div>
                    </div>

                    <div className={Styles.formRow}>
                        <div className={Styles.formGroup}>
                            <label>CEP *</label>
                            <input
                                type="text"
                                name="cep"
                                value={formData.cep}
                                onChange={handleChange}
                                placeholder="00000-000"
                                maxLength={9}
                                required
                            />
                            {cepLoading && <small style={{ color: '#c71585' }}>Buscando CEP...</small>}
                        </div>
                        <div className={Styles.formGroup}>
                            <label>Estado</label>
                            <input
                                type="text"
                                name="estado"
                                value={formData.estado}
                                onChange={handleChange}
                                placeholder="UF"
                                maxLength={2}
                            />
                        </div>
                    </div>

                    <div className={Styles.formGroup}>
                        <label>Logradouro *</label>
                        <input
                            type="text"
                            name="logradouro"
                            value={formData.logradouro}
                            onChange={handleChange}
                            placeholder="Rua, Avenida..."
                            required
                        />
                    </div>

                    <div className={Styles.formRow}>
                        <div className={Styles.formGroup}>
                            <label>Número *</label>
                            <input
                                type="text"
                                name="numero"
                                value={formData.numero}
                                onChange={handleChange}
                                placeholder="123"
                                required
                            />
                        </div>
                        <div className={Styles.formGroup}>
                            <label>Complemento</label>
                            <input
                                type="text"
                                name="complemento"
                                value={formData.complemento}
                                onChange={handleChange}
                                placeholder="Apto, Bloco..."
                            />
                        </div>
                    </div>

                    <div className={Styles.formRow}>
                        <div className={Styles.formGroup}>
                            <label>Bairro *</label>
                            <input
                                type="text"
                                name="bairro"
                                value={formData.bairro}
                                onChange={handleChange}
                                placeholder="Bairro"
                                required
                            />
                        </div>
                        <div className={Styles.formGroup}>
                            <label>Cidade *</label>
                            <input
                                type="text"
                                name="cidade"
                                value={formData.cidade}
                                onChange={handleChange}
                                placeholder="Cidade"
                                required
                            />
                        </div>
                    </div>

                    <div className={Styles.formGroup}>
                        <label>Descrição da Loja</label>
                        <textarea
                            name="descricao"
                            value={formData.descricao}
                            onChange={handleChange}
                            rows="4"
                            placeholder="Conte sobre sua confeitaria, especialidades e diferenciais..."
                        />
                    </div>
                </div>

                <div className={Styles.section}>
                    <h2>
                        <IoImage size={20} />
                        Imagem da Loja
                    </h2>
                    <ImageUploader 
                        onImageSelect={(imageUrl) => setFormData({...formData, imagem: imageUrl})}
                        currentImage={formData.imagem}
                    />
                </div>

                <div className={Styles.section}>
                    <h2>
                        <IoTime size={20} />
                        Horário de Funcionamento
                    </h2>
                    
                    <div className={Styles.horariosGrid}>
                        {diasSemana.map(dia => (
                            <div key={dia.key} className={Styles.horarioItem}>
                                <label>{dia.label}</label>
                                <input
                                    type="text"
                                    value={horarios[dia.key]}
                                    onChange={(e) => handleHorarioChange(dia.key, e.target.value)}
                                    placeholder="8:00 - 18:00 ou Fechado"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className={Styles.formActions}>
                    <button type="submit" className={Styles.saveButton}>
                        <IoSave size={20} />
                        Salvar Alterações
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PerfilLoja;