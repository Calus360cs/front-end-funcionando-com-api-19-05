import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';

const iconeMotoboy = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -38],
});

const iconeLoja = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/869/869636.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const iconeCliente = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/1077/1077114.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const MapaRastreamentoConfeiteiro = ({ pedidoId, coordsLoja, coordsCliente }) => {
  const [posicaoMotoboy, setPosicaoMotoboy] = useState(null);

  useEffect(() => {
    if (!pedidoId) return;

    const buscar = async () => {
      try {
        const pos = await api.get(`/pedidos/${pedidoId}/motoboy/localizacao`);
        if (pos?.lat && pos?.lng) setPosicaoMotoboy([pos.lat, pos.lng]);
      } catch {
        // posição indisponível
      }
    };

    buscar();
    const intervalo = setInterval(buscar, 5000);
    return () => clearInterval(intervalo);
  }, [pedidoId]);

  const centro = posicaoMotoboy || coordsLoja || [-23.55052, -46.633308];

  return (
    <div style={{ marginTop: '12px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #eee' }}>
      <MapContainer center={centro} zoom={14} style={{ height: '260px', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {coordsLoja && (
          <Marker position={coordsLoja} icon={iconeLoja}>
            <Popup>🏪 Confeitaria</Popup>
          </Marker>
        )}

        {coordsCliente && (
          <Marker position={coordsCliente} icon={iconeCliente}>
            <Popup>🏠 Cliente</Popup>
          </Marker>
        )}

        {posicaoMotoboy && (
          <Marker position={posicaoMotoboy} icon={iconeMotoboy}>
            <Popup>🛵 Entregador</Popup>
          </Marker>
        )}

        {posicaoMotoboy && coordsCliente && (
          <Polyline
            positions={[posicaoMotoboy, coordsCliente]}
            pathOptions={{ color: '#ff69b4', weight: 3, dashArray: '6 4' }}
          />
        )}
      </MapContainer>

      {!posicaoMotoboy && (
        <p style={{ textAlign: 'center', fontSize: '12px', color: '#999', margin: '6px 0' }}>
          Aguardando localização do entregador...
        </p>
      )}
    </div>
  );
};

export default MapaRastreamentoConfeiteiro;
