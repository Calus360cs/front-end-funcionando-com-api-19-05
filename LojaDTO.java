/*
    src/main/java/com/example/docelivery/dto/LojaDTO.java (Exemplo)
    Este é o objeto que será transformado em JSON e enviado para o frontend.
*/
package com.example.docelivery.dto;

import com.example.docelivery.model.Loja;

public class LojaDTO {

    private Long id;
    private String nome;
    
    // **A CHAVE DO PROBLEMA ESTÁ AQUI**
    // Garanta que o DTO que você envia para o frontend tenha o campo da URL da foto.
    // O nome pode ser "fotoUrl", "imagemUrl", "logoUrl", etc., desde que o frontend espere por ele.
    private String fotoUrl;

    // --- Construtores, Getters e Setters ---

    public LojaDTO() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getFotoUrl() {
        return fotoUrl;
    }

    public void setFotoUrl(String fotoUrl) {
        this.fotoUrl = fotoUrl;
    }

    // Método de fábrica para converter facilmente uma Entidade Loja em um LojaDTO.
    // Isso evita expor sua entidade de banco de dados diretamente para a API.
    public static LojaDTO fromEntity(Loja loja) {
        if (loja == null) return null;
        
        LojaDTO dto = new LojaDTO();
        dto.setId(loja.getId());
        dto.setNome(loja.getNomeFantasia());
        
        // **A MÁGICA ACONTECE AQUI**
        // Copiamos a URL da foto da entidade para o DTO.
        dto.setFotoUrl(loja.getFotoUrl());
        
        return dto;
    }
}
