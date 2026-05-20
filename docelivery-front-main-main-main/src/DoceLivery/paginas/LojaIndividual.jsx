import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CardapioPublico from '../Components/CardapioPublico';
import ConfeiteiroService from '../services/confeiteiroService';
import { IoArrowBack, IoStar, IoLocation, IoTime, IoCall, IoCalendarOutline } from 'react-icons/io5';
import Styles from './LojaIndividual.module.css';
import { IMAGE_MAP } from '../data/imageImports';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const IMAGE_URL = `${API_BASE_URL}/uploads`;

const LojaIndividual = () => {
    const { lojaId } = useParams();
    const navigate = useNavigate();
    const [loja, setLoja] = useState(null);
    const [showEncomendaModal, setShowEncomendaModal] = useState(false);
    const [encomendaData, setEncomendaData] = useState({
        produto: '',
        descricao: '',
        dataEntrega: '',
        observacoes: ''
    });

    useEffect(() => {
        const carregarLoja = async () => {
            try {
                const response = await ConfeiteiroService.getConfeiteiro(lojaId);
                const dados = response.data || response;
                
                const lojaInfo = dados.loja || dados;
                const rawImagem = lojaInfo.imagem || lojaInfo.imagemUrl || lojaInfo.logoUrl;

                setLoja({
                    id: lojaId,
                    nome: lojaInfo.nomeFantasia || lojaInfo.nome || 'Confeitaria',
                    telefone: lojaInfo.telefone || dados.telefone || '',
                    endereco: lojaInfo.endereco || (lojaInfo.logradouro ? `${lojaInfo.logradouro}, ${lojaInfo.numero}` : ''),
                    descricao: lojaInfo.descricao || '',
                    avaliacao: dados.avaliacao || '5.0',
                    totalAvaliacoes: dados.totalAvaliacoes || '0',
                    imagem: rawImagem 
                        ? (String(rawImagem).startsWith('http') || String(rawImagem).startsWith('/src') || String(rawImagem).startsWith('data:') 
                            ? rawImagem 
                            : `${IMAGE_URL}/${rawImagem}`)
                        : IMAGE_MAP['brigadeiro'],
                    horarioFuncionamento: lojaInfo.horarioFuncionamento || {
                        segunda: '08:00 - 18:00', terca: '08:00 - 18:00',
                        quarta: '08:00 - 18:00', quinta: '08:00 - 18:00',
                        sexta: '08:00 - 18:00', sabado: '08:00 - 16:00',
                        domingo: 'Fechado'
                    }
                });
            } catch (error) {
                console.error('Erro ao carregar loja:', error);
                const stored = localStorage.getItem('selectedStore');
                const storedData = stored ? JSON.parse(stored) : null;
                if (storedData) {
                    setLoja({
                        id: lojaId,
                        nome: storedData.nomeFantasia || storedData.nomeLoja || 'Confeitaria',
                        telefone: storedData.telefone || storedData.phone || '',
                        endereco: storedData.endereco || storedData.address || '',
                        descricao: storedData.descricao || storedData.description || '',
                        avaliacao: storedData.rating || storedData.avaliacao || '5.0',
                        totalAvaliacoes: storedData.reviews || '0',
                        imagem: storedData.logoUrl || null,
                        horarioFuncionamento: storedData.horarioFuncionamento || storedData.hours || {
                            segunda: '08:00 - 18:00', terca: '08:00 - 18:00',
                            quarta: '08:00 - 18:00', quinta: '08:00 - 18:00',
                            sexta: '08:00 - 18:00', sabado: '08:00 - 16:00',
                            domingo: 'Fechado'
                        }
                    });
                }
            }
        };
        if (lojaId) carregarLoja();
    }, [lojaId]);

    const handleVoltar = () => {
        navigate('/docelivery/cliente/Home-Page');
    };
    
    const handleEncomendaSubmit = (e) => {
        e.preventDefault();
        // Aqui você pode integrar com a agenda do confeiteiro
        alert(`Encomenda solicitada para ${encomendaData.dataEntrega}!\nEntraremos em contato para confirmar a disponibilidade.`);
        setShowEncomendaModal(false);
        setEncomendaData({ produto: '', descricao: '', dataEntrega: '', observacoes: '' });
    };
    
    if (!loja) {
        return <div>Carregando...</div>;
    }

    return (
        <div className={Styles.lojaIndividual}>
            <div className={Styles.header}>
                <button className={Styles.voltarBtn} onClick={handleVoltar}>
                    <IoArrowBack size={24} />
                </button>
                <h1>Loja</h1>
            </div>

            <div className={Styles.lojaHeader}>
                <div className={Styles.lojaImagem}>
                    <img 
                        src={loja.imagem} 
                        alt={loja.nome}
                        onError={(e) => e.target.src = IMAGE_MAP['brigadeiro']}
                    />
                </div>
                <div className={Styles.lojaInfo}>
                    <h2>{loja.nome}</h2>
                    <div className={Styles.avaliacao}>
                        <IoStar className={Styles.starIcon} />
                        <span>{loja.avaliacao}</span>
                        <span className={Styles.totalAvaliacoes}>({loja.totalAvaliacoes} avaliações)</span>
                    </div>
                    <div className={Styles.endereco}>
                        <IoLocation size={16} />
                        <span>{loja.endereco}</span>
                    </div>
                    <div className={Styles.telefone}>
                        <IoCall size={16} />
                        <span>{loja.telefone}</span>
                    </div>
                    <p className={Styles.descricao}>{loja.descricao}</p>
                </div>
            </div>

            <div className={Styles.horarioSection}>
                <h3>
                    <IoTime size={20} />
                    Horário de Funcionamento
                </h3>
                <div className={Styles.horarioGrid}>
                    {Object.entries(loja.horarioFuncionamento).map(([dia, horario]) => (
                        <div key={dia} className={Styles.horarioItem}>
                            <span className={Styles.dia}>{dia.charAt(0).toUpperCase() + dia.slice(1)}</span>
                            <span className={Styles.horario}>{horario}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={Styles.actionsSection}>
                <button 
                    className={Styles.encomendaBtn}
                    onClick={() => setShowEncomendaModal(true)}
                >
                    <IoCalendarOutline size={20} />
                    Fazer Encomenda
                </button>
            </div>

            <div className={Styles.cardapioSection}>
                <CardapioPublico loja={loja} />
            </div>
            
            {/* Modal de Encomenda */}
            {showEncomendaModal && (
                <div className={Styles.modalOverlay} onClick={() => setShowEncomendaModal(false)}>
                    <div className={Styles.encomendaModal} onClick={(e) => e.stopPropagation()}>
                        <h3>Fazer Encomenda - {loja.nome}</h3>
                        <form onSubmit={handleEncomendaSubmit}>
                            <div className={Styles.formGroup}>
                                <label>Produto/Tipo de Doce:</label>
                                <input
                                    type="text"
                                    value={encomendaData.produto}
                                    onChange={(e) => setEncomendaData({...encomendaData, produto: e.target.value})}
                                    placeholder="Ex: Bolo de chocolate, Brigadeiros..."
                                    required
                                />
                            </div>
                            <div className={Styles.formGroup}>
                                <label>Descrição/Detalhes:</label>
                                <textarea
                                    value={encomendaData.descricao}
                                    onChange={(e) => setEncomendaData({...encomendaData, descricao: e.target.value})}
                                    placeholder="Descreva detalhes como tamanho, sabor, decoração..."
                                    rows="3"
                                    required
                                />
                            </div>
                            <div className={Styles.formGroup}>
                                <label>Data de Entrega:</label>
                                <input
                                    type="date"
                                    value={encomendaData.dataEntrega}
                                    onChange={(e) => setEncomendaData({...encomendaData, dataEntrega: e.target.value})}
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>
                            <div className={Styles.formGroup}>
                                <label>Observações:</label>
                                <textarea
                                    value={encomendaData.observacoes}
                                    onChange={(e) => setEncomendaData({...encomendaData, observacoes: e.target.value})}
                                    placeholder="Observações adicionais..."
                                    rows="2"
                                />
                            </div>
                            <div className={Styles.modalActions}>
                                <button 
                                    type="button" 
                                    onClick={() => setShowEncomendaModal(false)}
                                    className={Styles.cancelBtn}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className={Styles.submitBtn}>
                                    Solicitar Encomenda
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LojaIndividual;