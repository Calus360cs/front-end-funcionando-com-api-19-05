/*
    src/main/java/com/example/docelivery/controller/LojaController.java (Exemplo)
    Este é o seu Controller que responde às requisições do frontend.
*/
package com.example.docelivery.controller;

import com.example.docelivery.dto.LojaDTO;
import com.example.docelivery.model.Loja;
import com.example.docelivery.repository.LojaRepository; // Seu repositório JPA
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/stores") // Verifique se este é o caminho que `StoreService.getStores()` chama
public class LojaController {

    @Autowired
    private LojaRepository lojaRepository;

    /**
     * Este método busca todas as lojas do banco de dados,
     * converte cada uma para um LojaDTO (que inclui a fotoUrl),
     * e retorna a lista para o frontend.
     */
    @GetMapping
    public ResponseEntity<List<LojaDTO>> getAllLojas() {
        // 1. Busca as entidades do banco
        List<Loja> lojas = lojaRepository.findAll();

        // 2. Converte a lista de Entidades para uma lista de DTOs
        //    É aqui que garantimos que a `fotoUrl` será incluída na resposta.
        List<LojaDTO> lojaDTOs = lojas.stream()
                                      .map(LojaDTO::fromEntity) // Usa o método de fábrica que criamos
                                      .collect(Collectors.toList());

        // 3. Retorna a lista de DTOs com status 200 OK
        return ResponseEntity.ok(lojaDTOs);
    }
}
