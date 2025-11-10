/* ==================================================================
   PROJECT AEGIS - SCRIPT DE INTERATIVIDADE
   ================================================================== */

// Espera todo o conteúdo do HTML ser carregado antes de rodar o script
document.addEventListener('DOMContentLoaded', () => {

    /* --- 1. LÓGICA PARA TROCA DE TEMA (DARK/LIGHT MODE) --- */
    
    // Encontra o botão no HTML pelo seu 'id'
    const themeToggleButton = document.getElementById('theme-toggle');

    // Adiciona um "ouvinte de evento" que espera por um clique
    themeToggleButton.addEventListener('click', () => {
        
        // Quando o botão é clicado, ele alterna a classe 'dark-theme' no <body>
        // - Se a classe não existe, ela é ADICIONADA.
        // - Se a classe já existe, ela é REMOVIDA.
        document.body.classList.toggle('dark-theme');

        // (Opcional) Você pode salvar a preferência do usuário no localStorage
        // if (document.body.classList.contains('dark-theme')) {
        //     localStorage.setItem('theme', 'dark');
        // } else {
        //     localStorage.setItem('theme', 'light');
        // }
    });

    // (Opcional) Para carregar o tema salvo pelo usuário ao recarregar a página
    // const savedTheme = localStorage.getItem('theme');
    // if (savedTheme === 'dark') {
    //     document.body.classList.add('dark-theme');
    // }

});
