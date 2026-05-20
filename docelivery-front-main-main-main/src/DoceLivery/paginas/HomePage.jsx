// pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// IMPORTAÇÕES DE ÍCONES NECESSÁRIAS
import { IoCartOutline, IoHeartOutline, IoHeart, IoChevronBackOutline, IoChevronForwardOutline, IoPersonOutline, IoLogOutOutline, IoSearchOutline, IoLocationOutline, IoStar, IoStarOutline, IoStarHalf } from 'react-icons/io5';
// IMPORTAÇÕES DO CARRINHO (Ajustar caminhos se a estrutura for diferente)
import CartComponent from "../Components/CartComponent.jsx";
import ConfirmationModal from "../Components/ConfirmationModal.jsx";
import FavoritesList from "../Components/FavoritesList.jsx";
import OrderCompletion from "../Components/OrderCompletion.jsx";

import { useCartStore } from "../context/CartContext.jsx"; // Caminho corrigido para a pasta Context
import { useFavorites } from "../context/FavoritesContext.jsx";

// Importações dos Componentes e Dados existentes
import StoreService from '../services/storeService';
import ProductService from '../services/produtoService.js';
import MOCK_DATA from "../Components/MockData";
import StoreCard from "../Components/StoreCard";
import OfferItem from "../Components/OfferItem";
import Logoloja from "../assests/img/doce_Livre_3.jpg"
import avatar from "../assests/img/avatar.png"
import Footer from "../Components/Footer.jsx"; // Importa o novo componente de rodapé
import Styles from "../paginas/HomePage.module.css"
import { IMAGE_MAP } from "../data/imageImports.jsx";


const HomePage = () => {
    const navigate = useNavigate();

    // 1. DESESTRUTURAÇÃO DO HOOK DO CARRINHO
    const {
        addItemToCart,
        totalItems,
        isCartOpen,
        toggleCart,
        isClearingCart
    } = useCartStore(); // Inicializa o hook de carrinho

    // 2. DESESTRUTURAÇÃO DO HOOK DE FAVORITOS
    const {
        toggleFavoriteStore,
        toggleFavoriteProduct,
        isStoreFavorite,
        isProductFavorite
    } = useFavorites();

    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState(null);
    const [stores, setStores] = useState(MOCK_DATA.stores || []);
    const featuredStores = (stores || []).filter(s => s.featured);
    const nearbyStores = (stores || []).slice(0, 8);
    const [offers, setOffers] = useState(MOCK_DATA.offers || []);
    const [categories, setCategories] = useState(MOCK_DATA.categories || []);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [currentOfferIndex, setCurrentOfferIndex] = useState(0);
    const [showFavorites, setShowFavorites] = useState(false);
    const [currentStoreIndex, setCurrentStoreIndex] = useState(0);

    const [selectedStore, setSelectedStore] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredStores, setFilteredStores] = useState(null);
    const [deliveryAddress, setDeliveryAddress] = useState('Entrega');
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [fetchedAddress, setFetchedAddress] = useState('');
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [showAddressList, setShowAddressList] = useState(false);
    const [pendingRatingOrder, setPendingRatingOrder] = useState(null);

    // Lojas melhores avaliadas (top 5 por rating + avaliações do cliente)
    const [topRatedStores, setTopRatedStores] = useState([]);
    // Lojas próximas por geolocalização
    const [nearbyByLocation, setNearbyByLocation] = useState([]);
    const [locationStatus, setLocationStatus] = useState('idle'); // idle | loading | granted | denied
    // Sugestões baseadas em pedidos anteriores
    const [previousOrderStores, setPreviousOrderStores] = useState([]);
    // Sugestões por preferências do perfil
    const [preferenceStores, setPreferenceStores] = useState([]);
    const [preferenceOffers, setPreferenceOffers] = useState([]);


    // Detecta quando entregador finaliza a entrega
    useEffect(() => {
        const checkDelivery = () => {
            const completed = localStorage.getItem('deliveryCompleted');
            if (completed) {
                const data = JSON.parse(completed);
                setPendingRatingOrder({
                    id: data.orderId,
                    storeName: data.storeName,
                });
                localStorage.removeItem('deliveryCompleted');
            }
        };
        checkDelivery();
        window.addEventListener('storage', checkDelivery);
        const interval = setInterval(checkDelivery, 3000);
        return () => {
            window.removeEventListener('storage', checkDelivery);
            clearInterval(interval);
        };
    }, []);

    // 1. Lojas melhores avaliadas: ordena por rating + pondera avaliações do cliente
    useEffect(() => {
        if (stores.length === 0) return;
        const clientRatings = JSON.parse(localStorage.getItem('storeRatings') || '[]');
        const ratingMap = {};
        clientRatings.forEach(r => {
            if (!ratingMap[r.storeName]) ratingMap[r.storeName] = [];
            ratingMap[r.storeName].push(r.storeRating);
        });
        const scored = stores.map(store => {
            const clientScores = ratingMap[store.name];
            const clientAvg = clientScores
                ? clientScores.reduce((a, b) => a + b, 0) / clientScores.length
                : null;
            const finalRating = clientAvg != null
                ? (store.rating * 0.7 + clientAvg * 0.3)
                : store.rating;
            return { ...store, finalRating };
        });
        setTopRatedStores(scored.sort((a, b) => b.finalRating - a.finalRating).slice(0, 5));
    }, [stores]);

    // 2. Lojas próximas por geolocalização
    useEffect(() => {
        if (stores.length === 0) return;
        setLocationStatus('loading');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                const calcDist = (lat1, lng1, lat2, lng2) => {
                    const R = 6371;
                    const dLat = (lat2 - lat1) * Math.PI / 180;
                    const dLng = (lng2 - lng1) * Math.PI / 180;
                    const a = Math.sin(dLat/2)**2 +
                        Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2;
                    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                };
                const withDist = stores
                    .filter(s => s.lat && s.lng)
                    .map(s => ({ ...s, distKm: calcDist(latitude, longitude, s.lat, s.lng) }))
                    .sort((a, b) => a.distKm - b.distKm)
                    .slice(0, 6);
                setNearbyByLocation(withDist);
                setLocationStatus('granted');
            },
            () => setLocationStatus('denied')
        );
    }, [stores]);

    // 3. Sugestões baseadas em pedidos anteriores
    useEffect(() => {
        if (stores.length === 0) return;
        const ratings = JSON.parse(localStorage.getItem('storeRatings') || '[]');
        const storeNames = [...new Set(ratings.map(r => r.storeName))];
        const suggested = stores.filter(s => storeNames.includes(s.name));
        setPreviousOrderStores(suggested);
    }, [stores]);

    // 4. Sugestões por preferências do perfil
    useEffect(() => {
        if (stores.length === 0 || offers.length === 0) return;
        const profile = JSON.parse(localStorage.getItem('clientProfile') || 'null');
        if (!profile) return;

        // Mapeamento preferência -> categoryId do MockData
        const PREF_TO_CATEGORY = {
            bolos:       101,
            churros:     102,
            cupcakes:    103,
            tortas:      104,
            brigadeiros: 106,
        };

        const activePrefs = Object.entries(profile.preferenciasDoces || {})
            .filter(([, v]) => v)
            .map(([k]) => k);

        if (activePrefs.length === 0) return;

        const activeCategoryIds = activePrefs
            .map(p => PREF_TO_CATEGORY[p])
            .filter(Boolean);

        // Produtos que batem com as preferências
        const matchedOffers = offers.filter(o => activeCategoryIds.includes(o.categoryId));

        // Lojas que têm pelo menos um produto nas preferências
        const matchedStoreNames = [...new Set(matchedOffers.map(o => o.store))];
        const matchedStores = stores.filter(s => matchedStoreNames.includes(s.name));

        setPreferenceOffers(matchedOffers);
        setPreferenceStores(matchedStores);
    }, [stores, offers]);

    const renderStars = (rating) => {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5;
        const empty = 5 - full - (half ? 1 : 0);
        return [
            ...Array(full).fill(null).map((_, i) => <IoStar key={`f${i}`} className={Styles.star_full} />),
            ...(half ? [<IoStarHalf key="h" className={Styles.star_full} />] : []),
            ...Array(empty).fill(null).map((_, i) => <IoStarOutline key={`e${i}`} className={Styles.star_empty} />),
        ];
    };

    const handleRatingSubmit = (ratingData) => {
        const existing = JSON.parse(localStorage.getItem('storeRatings') || '[]');
        localStorage.setItem('storeRatings', JSON.stringify([...existing, ratingData]));
        setPendingRatingOrder(null);
    };

    // FUNÇÃO PARA ADICIONAR ITEM
    const handleOfferClick = (offer) => {
        const storeObject = stores.find(s => s.name === offer.store);
        if (storeObject) {
            addItemToCart(offer, storeObject, 1);
        } else {
            console.error(`Loja não encontrada para a oferta: ${offer.store}.`);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const storesData = await StoreService.getStores().catch(() => null);

                const storesRaw = storesData?.length ? storesData.map(s => ({
                    id: s.id,
                    name: s.nomeLoja || s.nomeConfeitaria || s.nome,
                    nomeLoja: s.nomeLoja || s.nomeConfeitaria || s.nome,
                    categoria: s.categoria,
                    promocao: s.promocao,
                    telefone: s.telefone || '',
                    endereco: s.endereco || '',
                    descricao: s.descricao || '',
                    rating: s.avaliacao || 4.5,
                    deliveryTime: s.tempoEntrega || '30-45 min',
                    deliveryFee: s.taxaEntrega || 'R$ 5,00',
                    logoUrl: s.imagemUrl ? `http://localhost:8080/uploads/${s.imagemUrl}` : IMAGE_MAP['brigadeiro'],
                    imagemUrl: s.imagemUrl || null,
                    featured: s.destaque || false,
                    lat: s.lat,
                    lng: s.lng
                })) : MOCK_DATA.stores.map(store => ({
                    ...store,
                    logoUrl: IMAGE_MAP[store.logoKey]
                }));

                const offersRaw = MOCK_DATA.offers.map(offer => ({
                    ...offer,
                    imageUrl: offer.imageUrl || (offer.imageKey ? IMAGE_MAP[offer.imageKey] : IMAGE_MAP['brigadeiro'])
                }));

                localStorage.setItem('stores', JSON.stringify(storesRaw));
                setStores(storesRaw);
                setOffers(offersRaw);
                setCategories(MOCK_DATA.categories);
            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Auto-rotate carousels
    useEffect(() => {
        if (featuredStores.length > 0) {
            const storeInterval = setInterval(() => {
                setCurrentStoreIndex(prev => (prev + 1) % featuredStores.length);
            }, 4000);
            return () => clearInterval(storeInterval);
        }
    }, [featuredStores.length]);

    useEffect(() => {
        if (offers.length > 0) {
            const offerInterval = setInterval(() => {
                setCurrentOfferIndex(prev => (prev + 1) % offers.length);
            }, 3500);
            return () => clearInterval(offerInterval);
        }
    }, [offers.length]);



    useEffect(() => {
        const nome = localStorage.getItem('userName');
        const email = localStorage.getItem('userEmail');
        const tipo = localStorage.getItem('userType');
        if (nome) {
            setUser({ name: nome, email, tipo });
        }
        const saved = localStorage.getItem('savedAddresses');
        if (saved) setSavedAddresses(JSON.parse(saved));
    }, []);

    const handleStoreClick = (store) => {
        // Salvar dados da loja no localStorage para acesso na página individual
        localStorage.setItem('selectedStore', JSON.stringify(store));
        // Navegar para página da loja individual
        navigate(`/docelivery/loja/${store.id}`);
    };
    
    const handleCategoryFilter = (categoryId) => {
        setSelectedCategory(categoryId);
        if (categoryId == null) {
            const offersWithImages = MOCK_DATA.offers.map(offer => ({
                ...offer,
                imageUrl: IMAGE_MAP[offer.imageKey]
            }));
            setOffers(offersWithImages);
        } else {
            const filteredOffers = MOCK_DATA.offers.filter(o => o.categoryId === categoryId).map(offer => ({
                ...offer,
                imageUrl: IMAGE_MAP[offer.imageKey]
            }));
            setOffers(filteredOffers);
        }
    };
    
    const handleToggleFavoriteStore = (store) => {
        toggleFavoriteStore(store);
    };

    const handleToggleFavoriteProduct = (product) => {
        toggleFavoriteProduct(product);
    };
    
    const nextOffer = () => {
        setCurrentOfferIndex(prev => (prev + 1) % offers.length);
    };
    
    const prevOffer = () => {
        setCurrentOfferIndex(prev => (prev - 1 + offers.length) % offers.length);
    };
    
    const nextStore = () => {
        setCurrentStoreIndex(prev => (prev + 1) % featuredStores.length);
    };
    
    const prevStore = () => {
        setCurrentStoreIndex(prev => (prev - 1 + featuredStores.length) % featuredStores.length);
    };
    
    const handleSearch = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        
        if (term.trim() === '') {
            const offersWithImages = MOCK_DATA.offers.map(offer => ({
                ...offer,
                imageUrl: IMAGE_MAP[offer.imageKey]
            }));
            setOffers(offersWithImages);
            setFilteredStores(null);
        } else {
            const filteredOffers = MOCK_DATA.offers
                .filter(offer => 
                    offer.name.toLowerCase().includes(term.toLowerCase()) ||
                    offer.store.toLowerCase().includes(term.toLowerCase())
                )
                .map(offer => ({
                    ...offer,
                    imageUrl: IMAGE_MAP[offer.imageKey]
                }));
            setOffers(filteredOffers);

            const matched = stores.filter(store =>
                store.name.toLowerCase().includes(term.toLowerCase())
            );
            setFilteredStores(matched);
        }
    };
    
    const handleAddressClick = () => {
        setShowAddressModal(true);
    };
    
    const handleAddressSubmit = (address) => {
        setDeliveryAddress(address);
        
        // Add to saved addresses if not already exists
        if (!savedAddresses.includes(address)) {
            const newAddresses = [...savedAddresses, address];
            setSavedAddresses(newAddresses);
            localStorage.setItem('savedAddresses', JSON.stringify(newAddresses));
        }
        
        setShowAddressModal(false);
    };
    
    const logout = () => {
        // Limpar dados do usuário e redirecionar
        localStorage.removeItem('userToken');
        localStorage.removeItem('userType');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('nomeCliente');
        setUser(null);
        navigate('/');
    };
    



    if (loading) {
        return <div className={Styles.loading_page}>Carregando Doces...</div>;
    }

    return (
        <div className={Styles.docelivery_homepage}>
            
            {/* HEADER DA APLICAÇÃO */}
            <header className={Styles.main_header}>
                <div className={Styles.header_left} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                    <img src={Logoloja} alt="Logo" className={Styles.logo} />
                    <h1 className={Styles.brand_name}>Docelivery</h1>
                </div>
                
                <div className={Styles.header_center}>
                    <div className={Styles.search_container}>
                        <IoSearchOutline className={Styles.search_icon} size={20} />
                        <input
                            type="text"
                            placeholder="Buscar doces, lojas..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className={Styles.search_input}
                        />
                    </div>
                </div>
                
                <div className={Styles.header_right}>
                    {user ? (
                        <>
                            <div className={Styles.address_section}>
                                <div className={Styles.address_display}>
                                    <IoLocationOutline size={16} />
                                    <span className={Styles.address_text}>
                                        {deliveryAddress === 'Entrega' ? 'Adicionar endereço' : deliveryAddress.length > 30 ? `${deliveryAddress.substring(0, 30)}...` : deliveryAddress}
                                    </span>
                                    <button 
                                        className={Styles.address_dropdown_btn}
                                        onClick={() => setShowAddressList(!showAddressList)}
                                    >
                                        ▼
                                    </button>
                                </div>
                                
                                {showAddressList && (
                                    <div className={Styles.address_dropdown}>
                                        {savedAddresses.map((addr, index) => (
                                            <button
                                                key={index}
                                                className={Styles.address_option}
                                                onClick={() => {
                                                    setDeliveryAddress(addr);
                                                    setShowAddressList(false);
                                                }}
                                            >
                                                {addr.length > 40 ? `${addr.substring(0, 40)}...` : addr}
                                            </button>
                                        ))}
                                        <button
                                            className={Styles.add_address_btn}
                                            onClick={() => {
                                                setShowAddressModal(true);
                                                setShowAddressList(false);
                                            }}
                                        >
                                            + Adicionar novo endereço
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            <div className={Styles.user_info}>
                                <IoPersonOutline size={20} />
                                <span>Olá, {user.name.split(' ')[0]}!</span>
                            </div>
                            
                            <button 
                                className={Styles.profile_btn}
                                onClick={() => navigate('/docelivery/cliente/perfil')}
                                title="Meu Perfil"
                            >
                                <IoPersonOutline size={20} />
                            </button>
                            
                            <button
                                className={Styles.cart_btn}
                                onClick={toggleCart}
                                aria-label="Abrir Carrinho"
                                title={totalItems > 0 ? `Carrinho (${totalItems} ${totalItems === 1 ? 'item' : 'itens'})` : 'Carrinho vazio'}
                            >
                                <IoCartOutline size={24} />
                                {totalItems > 0 && (
                                    <span className={Styles.cart_badge}>{totalItems}</span>
                                )}
                            </button>
                            
                            <button 
                                className={Styles.favorites_btn}
                                onClick={() => setShowFavorites(true)}
                                title="Meus Favoritos"
                            >
                                <IoHeartOutline size={20} />
                            </button>
                            
                            <button className={Styles.logout_btn} onClick={logout}>
                                <IoLogOutOutline size={20} />
                                <span>Sair</span>
                            </button>
                        </>
                    ) : (
                        <div className={Styles.auth_buttons}>
                            <button className={Styles.login_btn}>Entrar</button>
                            <button className={Styles.register_btn}>Cadastrar</button>
                        </div>
                    )}
                </div>
            </header>

            {/* SEÇÕES DE CONTEÚDO PRINCIPAL */}
            <main className={Styles.main_content}>

                {/* RESULTADOS DE BUSCA DE LOJAS */}
                {filteredStores !== null && (
                    <section className={Styles.all_stores}>
                        <h2>{filteredStores.length > 0 ? `Lojas encontradas para "${searchTerm}"` : `Nenhuma loja encontrada para "${searchTerm}"`}</h2>
                        {filteredStores.length > 0 && (
                            <div className={Styles.all_stores_grid}>
                                {filteredStores.map(store => (
                                    <div key={store.id} className={Styles.store_card_all} onClick={() => handleStoreClick(store)}>
                                        <button
                                            className={Styles.favorite_btn_small}
                                            onClick={(e) => { e.stopPropagation(); handleToggleFavoriteStore(store); }}
                                        >
                                            {isStoreFavorite(store.id) ? <IoHeart size={14} /> : <IoHeartOutline size={14} />}
                                        </button>
                                        <div className={Styles.store_logo_all}>
                                            <img src={store.logoUrl} alt={store.name} className={Styles.store_logo_img_all} />
                                        </div>
                                        <div className={Styles.store_info_all}>
                                            <h4 className={Styles.store_name_all}>{store.name}</h4>
                                            <div className={Styles.store_rating_all}>
                                                <span>{store.rating}</span>
                                                <div className={Styles.stars_row}>{renderStars(store.rating)}</div>
                                            </div>
                                            <div className={Styles.store_delivery_all}>
                                                <span>{store.deliveryTime}</span>
                                                <span className={Styles.store_fee_all}> • {store.deliveryFee || store.fee}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
                
                {/* PARA VOCÊ - preferências do perfil */}
                {(preferenceStores.length > 0 || preferenceOffers.length > 0) && (
                    <>
                        {preferenceStores.length > 0 && (
                            <section className={Styles.featured_stores}>
                                <div className={Styles.stores_header}>
                                    <h2>💖 Lojas Para Você</h2>
                                </div>
                                <div className={Styles.nearby_grid}>
                                    {preferenceStores.map(store => (
                                        <div key={store.id} className={Styles.store_carousel_item}>
                                            <button className={Styles.favorite_btn} onClick={() => handleToggleFavoriteStore(store)}>
                                                {isStoreFavorite(store.id) ? <IoHeart size={16} /> : <IoHeartOutline size={16} />}
                                            </button>
                                            <StoreCard store={store} onClick={handleStoreClick} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {preferenceOffers.length > 0 && (
                            <section className={Styles.sweet_offers}>
                                <div className={Styles.offers_header}>
                                    <h2>🍬 Doces Para Você</h2>
                                </div>
                                <div className={Styles.offers_carousel}>
                                    <div className={Styles.offers_track} style={{ transform: 'translateX(0)' }}>
                                        {preferenceOffers.map(offer => (
                                            <div key={offer.id} className={Styles.offer_wrapper}>
                                                <button className={Styles.favorite_btn} onClick={() => handleToggleFavoriteProduct(offer)}>
                                                    {isProductFavorite(offer.id) ? <IoHeart size={20} /> : <IoHeartOutline size={20} />}
                                                </button>
                                                <OfferItem offer={offer} onClick={handleOfferClick} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        )}
                    </>
                )}

                {/* 2. LOJAS EM DESTAQUE - melhores avaliadas */}
                <section className={Styles.featured_stores}>
                    <div className={Styles.stores_header}>
                        <h2>⭐ Lojas Mais Bem Avaliadas</h2>
                        <div className={Styles.carousel_controls}>
                            <button onClick={prevStore} className={Styles.carousel_btn}><IoChevronBackOutline size={20} /></button>
                            <button onClick={nextStore} className={Styles.carousel_btn}><IoChevronForwardOutline size={20} /></button>
                        </div>
                    </div>
                    <div className={Styles.stores_carousel}>
                        <div
                            className={Styles.stores_track}
                            style={{ transform: `translateX(-${currentStoreIndex * 300}px)` }}
                        >
                            {topRatedStores.map(store => (
                                <div key={store.id} className={Styles.store_carousel_item}>
                                    <button className={Styles.favorite_btn} onClick={() => handleToggleFavoriteStore(store)}>
                                        {isStoreFavorite(store.id) ? <IoHeart size={16} /> : <IoHeartOutline size={16} />}
                                    </button>
                                    <div className={Styles.rating_badge}>⭐ {store.finalRating?.toFixed(1)}</div>
                                    <StoreCard store={store} onClick={handleStoreClick} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 3. CATEGORIAS POPULARES */}
                <section className={Styles.popular_categories}>
                    <h2>Categorias Populares</h2>
                    <div className={Styles.category_list}>
                        {categories.map(category => (
                            <button
                                key={category.id}
                                className= {`${Styles.category_tag} ${selectedCategory === category.id ? Styles.active : ''}`}
                                onClick={() => handleCategoryFilter(category.id)}
                            >
                                {category.name}
                            </button>
                        ))}
                        <button
                            className={`${Styles.category_tag} ${selectedCategory === null ? Styles.active : ''}`}
                            onClick={() => handleCategoryFilter(null)}
                        >
                            Ver Todos
                        </button>
                    </div>
                </section>

                {/* 4. OFERTAS DOCES */}
                <section className={Styles.sweet_offers}>
                    <div className={Styles.offers_header}>
                        <h2>Ofertas Doces</h2>
                        <div className={Styles.carousel_controls}>
                            <button onClick={prevOffer} className={Styles.carousel_btn}>
                                <IoChevronBackOutline size={20} />
                            </button>
                            <button onClick={nextOffer} className={Styles.carousel_btn}>
                                <IoChevronForwardOutline size={20} />
                            </button>
                        </div>
                    </div>
                    <div className={Styles.offers_carousel}>
                        <div 
                            className={Styles.offers_track}
                            style={{ transform: `translateX(-${currentOfferIndex * 300}px)` }}
                        >
                            {offers.map((offer, index) => (
                                <div key={offer.id} className={Styles.offer_wrapper}>
                                    <button 
                                        className={Styles.favorite_btn}
                                        onClick={() => handleToggleFavoriteProduct(offer)}
                                    >
                                        {isProductFavorite(offer.id) ? 
                                            <IoHeart size={20} /> : 
                                            <IoHeartOutline size={20} />
                                        }
                                    </button>
                                    <OfferItem offer={offer} onClick={handleOfferClick} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 4b. SUGESTÕES DE PEDIDOS ANTERIORES */}
                {previousOrderStores.length > 0 && (
                    <section className={Styles.nearby_stores}>
                        <h2>🔄 Peça Novamente</h2>
                        <p className={Styles.section_subtitle}>Lojas que você já pediu e adorou</p>
                        <div className={Styles.nearby_grid}>
                            {previousOrderStores.map(store => (
                                <div key={store.id} className={Styles.store_carousel_item}>
                                    <button className={Styles.favorite_btn} onClick={() => handleToggleFavoriteStore(store)}>
                                        {isStoreFavorite(store.id) ? <IoHeart size={16} /> : <IoHeartOutline size={16} />}
                                    </button>
                                    <StoreCard store={store} onClick={handleStoreClick} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 5. CONFEITARIAS PRÓXIMAS - por geolocalização */}
                <section className={Styles.nearby_stores}>
                    <h2>📍 Confeitarias Próximas de Você</h2>
                    {locationStatus === 'loading' && (
                        <p className={Styles.section_subtitle}>Buscando sua localização...</p>
                    )}
                    {locationStatus === 'denied' && (
                        <p className={Styles.section_subtitle}>
                            🔒 Permita o acesso à localização para ver confeitarias próximas.
                        </p>
                    )}
                    {locationStatus === 'granted' && nearbyByLocation.length > 0 && (
                        <div className={Styles.nearby_grid}>
                            {nearbyByLocation.map(store => (
                                <div key={store.id} className={Styles.store_carousel_item}>
                                    <button className={Styles.favorite_btn} onClick={() => handleToggleFavoriteStore(store)}>
                                        {isStoreFavorite(store.id) ? <IoHeart size={16} /> : <IoHeartOutline size={16} />}
                                    </button>
                                    <div className={Styles.distance_badge}>
                                        📍 {store.distKm < 1
                                            ? `${(store.distKm * 1000).toFixed(0)}m`
                                            : `${store.distKm.toFixed(1)}km`}
                                    </div>
                                    <StoreCard store={store} onClick={handleStoreClick} />
                                </div>
                            ))}
                        </div>
                    )}
                    {(locationStatus === 'idle' || locationStatus === 'denied') && (
                        <div className={Styles.nearby_grid}>
                            {nearbyStores.map(store => (
                                <div key={store.id} className={Styles.store_carousel_item}>
                                    <button className={Styles.favorite_btn} onClick={() => handleToggleFavoriteStore(store)}>
                                        {isStoreFavorite(store.id) ? <IoHeart size={16} /> : <IoHeartOutline size={16} />}
                                    </button>
                                    <StoreCard store={store} onClick={handleStoreClick} />
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* 6. TODAS AS LOJAS */}
                <section className={Styles.all_stores}>
                    <h2>Todas as Lojas</h2>
                    <div className={Styles.all_stores_grid}>
                        {stores.map(store => (
                            <div key={store.id} className={Styles.store_card_all} onClick={() => handleStoreClick(store)}>
                                <button 
                                    className={Styles.favorite_btn_small}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleFavoriteStore(store);
                                    }}
                                >
                                    {isStoreFavorite(store.id) ? 
                                        <IoHeart size={14} /> : 
                                        <IoHeartOutline size={14} />
                                    }
                                </button>
                                
                                <div className={Styles.store_logo_all}>
                                    <img 
                                        src={store.logoUrl} 
                                        alt={store.name}
                                        className={Styles.store_logo_img_all}
                                    />
                                </div>
                                
                                <div className={Styles.store_info_all}>
                                    <h4 className={Styles.store_name_all}>{store.name}</h4>
                                    <div className={Styles.store_rating_all}>
                                        <span>{store.rating}</span>
                                        <div className={Styles.stars_row}>{renderStars(store.rating)}</div>
                                    </div>
                                    <div className={Styles.store_delivery_all}>
                                        <span>{store.deliveryTime}</span>
                                        <span className={Styles.store_fee_all}> • {store.deliveryFee || store.fee}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </main>

            {/* RODAPÉ PADRONIZADO */}
            <Footer />

            {/* 6. SIDEBAR DO CARRINHO (Fora do main_layout e da header) */}
            {/* O CartComponent.module.css precisa estar importado em algum lugar que tenha acesso às classes 'cart_sidebar' e 'open' */}
            <aside
                className={`${Styles.cart_sidebar} ${isCartOpen ? Styles.open : ''}`}
            >
                <CartComponent />
            </aside>

            {/* MODAL DE CONFIRMAÇÃO PARA MUDANÇA DE LOJA */}
            {isClearingCart && <ConfirmationModal />}
            
            {/* MODAL DE FAVORITOS */}
            <FavoritesList 
                isOpen={showFavorites} 
                onClose={() => setShowFavorites(false)} 
            />
            

            
            {/* MODAL DE ENDEREÇO */}
            {showAddressModal && (
                <div className={Styles.address_modal_overlay} onClick={() => setShowAddressModal(false)}>
                    <div className={Styles.address_modal} onClick={(e) => e.stopPropagation()}>
                        <h3>Endereço de Entrega</h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            
                            if (fetchedAddress) {
                                handleAddressSubmit(fetchedAddress);
                                setFetchedAddress('');
                                return;
                            }
                            
                            const cep = e.target.cep.value.replace(/\D/g, '');
                            
                            if (cep.length === 8) {
                                try {
                                    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                                    const data = await response.json();
                                    
                                    if (!data.erro) {
                                        const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}, CEP: ${data.cep}`;
                                        setFetchedAddress(fullAddress);
                                    } else {
                                        alert('CEP não encontrado!');
                                    }
                                } catch (error) {
                                    alert('Erro ao buscar CEP. Tente novamente.');
                                }
                            } else {
                                alert('Digite um CEP válido com 8 dígitos!');
                            }
                        }}>
                            <input
                                type="text"
                                name="cep"
                                placeholder="Digite apenas o CEP (ex: 12345678)"
                                className={Styles.address_input}
                                maxLength="9"
                                required
                                disabled={fetchedAddress}
                                onChange={(e) => {
                                    let value = e.target.value.replace(/\D/g, '');
                                    if (value.length > 5) {
                                        value = value.replace(/(\d{5})(\d)/, '$1-$2');
                                    }
                                    e.target.value = value;
                                }}
                            />
                            
                            {fetchedAddress && (
                                <div className={Styles.address_preview}>
                                    <h4>Endereço de Entrega:</h4>
                                    <p>{fetchedAddress}</p>
                                </div>
                            )}
                            
                            <p className={Styles.address_help}>
                                {fetchedAddress ? 'Confirme o endereço acima' : 'Digite o CEP e o endereço será preenchido automaticamente'}
                            </p>
                            <div className={Styles.address_modal_actions}>
                                <button 
                                    type="button" 
                                    onClick={() => {
                                        setShowAddressModal(false);
                                        setFetchedAddress('');
                                    }}
                                    className={Styles.cancel_address_btn}
                                >
                                    Cancelar
                                </button>
                                {fetchedAddress && (
                                    <button 
                                        type="button" 
                                        onClick={() => setFetchedAddress('')}
                                        className={Styles.edit_address_btn}
                                    >
                                        Editar CEP
                                    </button>
                                )}
                                <button 
                                    type="submit"
                                    className={Styles.save_address_btn}
                                >
                                    {fetchedAddress ? 'Confirmar Endereço' : 'Buscar CEP'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage;