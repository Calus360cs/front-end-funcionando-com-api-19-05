/*
    src/main/java/com/example/docelivery/model/Loja.java (Exemplo)
    Este é um exemplo da sua classe de Entidade (tabela do banco de dados).
*/
package com.example.docelivery.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;

@Entity
public class Loja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nomeFantasia;

    // Garanta que sua entidade `Loja` tenha um campo para armazenar o caminho da imagem.
    // Este campo deve ser populado quando o confeiteiro faz o upload da imagem.
    // Ex: "/uploads/lojas/minha-imagem.jpg"
    private String fotoUrl;

    // --- Getters e Setters ---

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNomeFantasia() {
        return nomeFantasia;
    }

    public void setNomeFantasia(String nomeFantasia) {
        this.nomeFantasia = nomeFantasia;
    }

    public String getFotoUrl() {
        return fotoUrl;
    }

    public void setFotoUrl(String fotoUrl) {
        this.fotoUrl = fotoUrl;
    }
}
