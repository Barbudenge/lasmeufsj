# Car Motion Lab

Webapp estático para estudar o funcionamento de motor, câmbio, diferencial e rodas.

## Como abrir

Abra `index.html` no navegador ou publique a pasta no GitHub Pages. Não há etapa de build nem dependências externas.

## O que o app calcula

- Rotação do motor em rpm.
- Rotação do eixo intermediário do câmbio.
- Rotação de saída do câmbio.
- Rotação média após o diferencial.
- Rotação e velocidade de cada roda em reta ou curva.
- Velocidade do carro para cada marcha disponível.

## Como usar

- Use o pedal `Acelerar +5` para aumentar a velocidade do carro.
- Use `Frear -5` para reduzir a velocidade.
- Clique nos números do seletor em H para trocar a marcha.
- Ao trocar marcha, a velocidade do carro fica praticamente igual e a rotação do motor muda conforme a relação da marcha.
- Troque o tamanho da roda para ver a roda mudar no desenho lateral e superior.
- Em curva, a vista superior mostra o centro da curva e as rodas dianteiras em geometria Ackermann.

## Modelo

O app usa a convenção:

```text
i_cambio = n_motor / n_saida_cambio
n_saida_cambio = n_roda_media * i_diferencial
n_motor = |n_saida_cambio * i_cambio|
```

Em curva, a velocidade no centro do veículo continua sendo a média entre as rodas esquerda e direita:

```text
v_interna = v_centro * (R - L/2) / R
v_externa = v_centro * (R + L/2) / R
```

## Arquivos

- `index.html`: estrutura do app.
- `styles.css`: layout, tema claro/escuro, painel, seletor em H e desenhos SVG.
- `calculator.js`: modelo matemático e presets.
- `app.js`: controles, idioma PT/EN, pedal, velocímetros, SVGs e animação.
