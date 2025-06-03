# 🦷 Top Dent Clinic Manager

Sistema de gerenciamento odontológico completo com cadastro de pacientes, agendamento de consultas, prontuários, anamnese e planos de tratamento.

---

## 📊 Painel Principal (Dashboard)

- **Visão Geral**: Resumo das atividades e informações importantes.
- **Acesso Rápido**:
  - ➕ Novo Paciente
  - 📅 Agendar Consulta
  - 📋 Ver Prontuário
  - 📝 Adicionar Tratamento
  - 🚪 Sair (logout simulado)
- **Próximos Agendamentos**:
  - Lista dos 5 agendamentos mais próximos.
  - Botões para "Ver Paciente" e "Ver Todos Agendamentos".
- **Lembretes**:
  - Exibição de alertas (ex: "Encomendar material").

---

## 🙋‍♂️ Gestão de Pacientes

### ➕ Cadastro de Novo Paciente

- **Dados Pessoais**: Nome, nascimento, responsável, RG, CPF, telefone.
- **Endereço**: Rua, número, bairro.
- **Contato de Emergência**: Nome e telefone.
- **Anamnese Inicial** (opcional):
  - Medicação, Fumante, Gestante, Alergias, Doenças, Cirurgias, Pressão Arterial.
- **Ações**:
  - 💾 Salvar
  - 🔄 Limpar Tudo
  - ↩️ Voltar

### ✏️ Edição de Paciente

- Permite editar dados pessoais, endereço e contato.
- A anamnese é editada separadamente.
- 💾 Atualizar

### 👥 Lista de Pacientes

- Busca por nome ou CPF.
- Modos de visualização: Cards ou Tabela.
- Ações:
  - 📋 Detalhes
  - ✏️ Editar
  - 🗑️ Excluir (com verificação de vínculos)

---

## 🩺 Gestão de Anamnese

### 📄 Tela do Paciente

- Modo visualização e modo formulário.
- Campos: medicação, fumante, gestante, alergias, doenças, cirurgias, PA.
- ✍️ Editar / Salvar / Cancelar

### 📝 Formulário Independente

- CPF obrigatório para vincular.
- Usado fora do perfil do paciente.

---

## 📝 Planos de Tratamento

### ➕ Novo Plano

- CPF do paciente
- Descrição, upload de arquivos, assinatura do dentista
- 💾 Salvar / 🔄 Limpar / ↩️ Voltar

### ✏️ Editar Plano

- Altera descrição, arquivo e assinatura
- CPF não editável

### 📄 Tratamentos por Paciente

- Lista com data, descrição, arquivo, assinatura
- Ações: ✏️ Editar / 🗑️ Apagar / ➕ Novo Plano / ↩️ Voltar

### 📑 Todos os Planos

- Filtro por paciente
- Ações: ✏️ Editar / 🗑️ Apagar / ➕ Criar Novo Plano

---

## 🗓️ Gestão de Agendamentos

### ➕ Criar / ✏️ Editar Agendamento

- CPF ou nome do paciente
- Data, hora, procedimentos, status
- 💾 Salvar / 🚫 Cancelar

### 📅 Lista de Agendamentos

- Ordenação por data/hora
- Colunas: Data, Hora, Paciente, Procedimento, Status, Ações
- Ações: ✏️ Editar / 🗑️ Excluir

---

## 📂 Prontuário Completo

### 🔍 Busca

- Por nome ou CPF
- Autocompletar + botão "Buscar"

### 📄 Seções do Prontuário

- Dados Pessoais
- Anamnese Resumida
- Histórico de PA
- Planos de Tratamento
- Histórico de Agendamentos
- 🔄 Limpar / Voltar

---

## ✨ Componentes Globais

- 🧭 Navegação: Header com links principais
- 📱 Menu responsivo para mobile
- 🚪 Logout (alerta)
- 🦶 Rodapé com informações
- 🖼️ Modal de imagem
- ⚠️ Modal de confirmação
- 🍞 Toasts (notificações)
- 🎨 UI:
  - Tema escuro
  - Ícones, cards, tabelas, inputs padronizados
  - Layout responsivo

---

## 📸 Template de Impressão - Registro Clínico

```text
PROCEDIMENTOS REALIZADOS
________________________________________________________
________________________________________________________
________________________________________________________
________________________________________________________
________________________________________________________

MEDICAÇÃO PRESCRITA
________________________________________________________
________________________________________________________
________________________________________________________
________________________________________________________

PAGAMENTOS REALIZADOS
VALOR: ___________     FORMA DE PAGT: _____________     DATA: ___ / ___ / ______
VALOR: ___________     FORMA DE PAGT: _____________     DATA: ___ / ___ / ______
VALOR: ___________     FORMA DE PAGT: _____________     DATA: ___ / ___ / ______
VALOR: ___________     FORMA DE PAGT: _____________     DATA: ___ / ___ / ______
