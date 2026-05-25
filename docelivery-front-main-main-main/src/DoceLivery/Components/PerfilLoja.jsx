import React, { useState, useEffect } from 'react';
import { IoSave, IoTime, IoImage, IoLocation } from 'react-icons/io5';
import { useLoja } from '../context/LojaContext';
import ImageUploader from './ImageUploader';
import Styles from './PerfilLoja.module.css';
import confeiteiroService, { atualizarPerfilLoja } from '../services/confeiteiroService';

const PerfilLoja = () => {
    const { dadosLoja, atualizarDadosLoja, atualizarHorarioFuncionamento } = useLoja();
    
    // Guardaremos o id real da loja retornado pelo banco de dados dinamicamente aqui
    // eslint-disable-next-line no-unused-vars
    const [lojaIdReal, setLojaIdReal] = useState(null);

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        telefone: '',
        cnpj: '',
        cep: '',
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        cidade: '',
        estado: '',
        descricao: '',
        imagem: '',
    });
    
    const [horarios, setHorarios] = useState({
        segunda: '', terca: '', quarta: '', quinta: '', sexta: '', sabado: '', domingo: ''
    });
    const [cepLoading, setCepLoading] = useState(false);

    // Carrega os dados reais vindos do banco de dados ao montar o componente
    useEffect(() => {
        const carregarPerfilAPI = async () => {
            const idUsuario = localStorage.getItem('userId');
            if (!idUsuario) return;

            try {
                const usuario = await confeiteiroService.getConfeiteiro(idUsuario);
                
                if (usuario) {
                    // 🟢 CAPTURA DO ID REAL DA LOJA
                    if (usuario.loja?.id) {
                        setLojaIdReal(usuario.loja.id);
                    }

                    // Tratamento seguro do endereço splitado
                    const enderecoPartes = usuario.loja?.endereco ? usuario.loja.endereco.split(',') : [];
                    const logradouroBase = enderecoPartes[0] || usuario.logradouro || '';
                    const numeroBase = enderecoPartes[1] ? enderecoPartes[1].trim() : '';

                    setFormData({
                        nome: usuario.loja?.nomeFantasia || usuario.nomeLoja || usuario.nomeConfeitaria || usuario.nome || '',
                        email: usuario.email || '',
                        telefone: usuario.loja?.telefone || usuario.telefone || '',
                        cnpj: usuario.loja?.cnpj || usuario.cnpj || '',
                        cep: usuario.loja?.cep || usuario.cep || '',
                        logradouro: logradouroBase,
                        numero: numeroBase,
                        complemento: usuario.complemento || '',
                        bairro: usuario.loja?.bairro || usuario.bairro || '',
                        cidade: usuario.loja?.cidade || usuario.cidade || '',
                        estado: usuario.loja?.uf || usuario.loja?.estado || usuario.uf || usuario.estado || '',
                        descricao: usuario.loja?.descricao || usuario.descricao || '',
                        imagem: usuario.loja?.fotoUrl || usuario.loja?.imagem || usuario.imagemUrl || usuario.imagem || '',
                    });

                    if (usuario.loja?.horarioFuncionamento) {
                        setHorarios(usuario.loja.horarioFuncionamento);
                    } else if (dadosLoja?.horarioFuncionamento) {
                        setHorarios(dadosLoja.horarioFuncionamento);
                    }
                }
            } catch (error) {
                console.error("Erro ao carregar perfil da API, tentando dados do contexto local:", error);
                // Fallback caso a API falhe na primeira requisição
                if (dadosLoja) {
                    setFormData({
                        nome: dadosLoja.nomeFantasia || dadosLoja.nome || '',
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
                }
            }
        };

        carregarPerfilAPI();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // 🟢 Removido 'dadosLoja' daqui para evitar loops de re-render e perdas de dados

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
                                city: data.localidade || '', // Certifique-se se no seu estado é cidade ou city
                                cidade: data.localidade || '',
                                estado: data.uf || '',
                            }));
                        }
                    })
                    .catch(err => console.error("Erro ao buscar CEP", err))
                    .finally(() => setCepLoading(false));
            }
        }
    };

    const handleHorarioChange = (dia, valor) => {
        setHorarios(prev => ({ ...prev, [dia]: valor }));
    };

    const tratarSalvar = async (e) => {
        e.preventDefault();

        // CORREÇÃO 1: Envia sempre o ID do confeiteiro para bater com a busca findByConfeiteiroId no Java
        const idParaAtualizar = localStorage.getItem('userId');
        
        // 1. Garante que a foto enviada seja estritamente uma String (URL)
        let urlImagem = '';
        if (formData.imagem) {
            if (typeof formData.imagem === 'object') {
                // Se o uploader salvou como objeto, tenta pegar a propriedade de URL interna
                urlImagem = formData.imagem.url || formData.imagem.fotoUrl || '';
            } else {
                urlImagem = formData.imagem;
            }
        }

        // 2. Monta o payload limpando máscaras de CNPJ/Telefone e protegendo strings
        const dadosDaLoja = {
            nomeFantasia: formData.nome,
            cnpj: formData.cnpj ? formData.cnpj.replace(/\D/g, '') : null, // Envia apenas números
            telefone: formData.telefone ? formData.telefone.replace(/\D/g, '') : null, // Envia apenas números
            descricao: formData.descricao || '',
            endereco: `${formData.logradouro}, ${formData.numero}${formData.complemento ? ' - ' + formData.complemento : ''}`,
            fotoUrl: urlImagem // Agora garantido como String!
        };

        try {
            console.log("Enviando payload corrigido:", dadosDaLoja); 
            const response = await atualizarPerfilLoja(idParaAtualizar, dadosDaLoja);

            if (response) {
                // CORREÇÃO 2: Mapeia corretamente o Confeiteiro completo retornado pelo Java e extrai a loja interna
                const confeiteiroAtualizado = response.data || response;
                localStorage.setItem('user', JSON.stringify(confeiteiroAtualizado));

                const lojaAtualizada = confeiteiroAtualizado.loja || {};

                atualizarDadosLoja({
                    nome: lojaAtualizada.nomeFantasia || formData.nome,
                    descricao: lojaAtualizada.descricao || formData.descricao,
                    cnpj: lojaAtualizada.cnpj || formData.cnpj,
                    telefone: lojaAtualizada.telefone || formData.telefone,
                    endereco: lojaAtualizada.endereco || `${formData.logradouro}, ${formData.numero}`,
                    bairro: formData.bairro,
                    cidade: formData.cidade,
                    estado: formData.estado,
                    cep: formData.cep,
                    imagem: lojaAtualizada.fotoUrl || urlImagem || ''
                });
                atualizarHorarioFuncionamento(horarios);
            }
            
            // 2. Dispara o evento global para avisar o ConfeiteiroDashboard para reler o banco
            window.dispatchEvent(new Event('localStorageUpdate'));
            localStorage.setItem('nomeLoja', formData.nome);
            alert("Perfil da loja atualizado com sucesso!");
        } catch (erro) {
            console.error(erro);
            alert("Erro ao atualizar perfil. Verifique os dados ou a conexão.");
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

            <form onSubmit={tratarSalvar} className={Styles.perfilForm}>
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
                                    value={horarios[dia.key] || ''}
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