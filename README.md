🦷 Top Dent Clinic Manager - Funcionalidades Detalhadas
🏠 Painel Principal (Dashboard)
📊 Visão Geral
Apresenta um resumo das atividades e informações importantes.

🚀 Acesso Rápido
➕ Novo Paciente: Atalho para cadastrar um novo paciente rapidamente.

📅 Agendar Consulta: Abre o modal de agendamento de consultas.

📋 Ver Prontuário: Tela de visualização de prontuários completos.

📝 Adicionar Tratamento: Criação de novos planos de tratamento.

🚪 Sair: Simula o logout do sistema (exibe um alerta).

🗓️ Próximos Agendamentos
Lista os próximos 5 agendamentos (data, hora, paciente, procedimento, status).

Botão "Ver Paciente" → Detalhes do paciente.

Botão "Ver Todos Agendamentos" → Lista completa.

🔔 Lembretes
Exibe lembretes importantes (ex: "Encomendar material").

🙋‍♂️ Gestão de Pacientes
🆕 Cadastro de Novo Paciente (/new-patient)
👤 Dados Pessoais: Nome, nascimento, responsável, RG, CPF (ID único), telefone
🏠 Endereço: Rua, número, bairro
🆘 Contato de Emergência: Nome e telefone

📄 Anamnese Inicial (opcional)
💊 Medicação: Usa? Quais?

🚬 Fumante: Sim/Não

🤰 Gestante: Sim/Não

🤧 Alergias: Sim, Não, Não Sei

🩺 Doenças: Cardíaca, Respiratória, etc. + Campo “Outras”

🔪 Cirurgias: Já fez? Quais?

🩸 Pressão Arterial: Vários registros (data e valor)

Ações:

💾 Salvar

🔄 Limpar Tudo

↩️ Voltar

✏️ Edição de Paciente (/patient/edit/:patientId)
Carrega dados via CPF

Edita dados pessoais, endereço, emergência

⚠️ Anamnese não é editada aqui

💾 Atualizar

👥 Lista de Pacientes (/patients)
📑 Lista completa

🔍 Busca por nome/CPF

Modos de Visualização:

🃏 Cards: Resumo + ações

📜 Lista: Tabela com colunas

Ações:

📋 Detalhes

✏️ Editar

🗑️ Excluir (com modal de confirmação)
⚠️ Exclusão pode ser impedida se houver dados vinculados

ℹ️ Detalhes do Paciente (/patient/:patientId)
Exibe Dados Pessoais, Endereço, Emergência

🔗 Links:

🩺 Ver/Preencher Anamnese

📝 Ver/Preencher Tratamentos

↩️ Voltar

🩺 Gestão de Anamnese
📄 Tela de Anamnese (/patient/:patientId/anamnesis)
Modo Visualização:

Exibe dados existentes

Modo Formulário (novo ou edição):

Preenche ou atualiza

➕ Adiciona/remover registros de P.A.

Ações:

💾 Salvar Anamnese

🚫 Cancelar

↩️ Voltar

📝 Formulário Standalone (/anamnesis)
Digita CPF para vincular

Similar à tela vinculada ao paciente

📝 Gestão de Planos de Tratamento
➕ Novo Plano (/treatment-plan)
CPF obrigatório

📜 Descrição

☁️ Upload (PDF, PNG, JPG)

🖋️ Assinatura do dentista

Ações:

💾 Salvar

🔄 Limpar

↩️ Voltar

✏️ Editar Plano (/treatment-plan/edit/:planId)
Altera descrição, assinatura, arquivo

CPF não é editável

💾 Atualizar

↩️ Voltar

📄 Tratamentos por Paciente (/patient/:patientId/treatment-plans)
📅 Data, descrição, arquivo, assinatura

🖼️ Miniatura (se imagem)

🔗 PDF com link de download

Ações:

✏️ Editar

🗑️ Apagar

➕ Novo Plano

↩️ Voltar

📑 Todos os Tratamentos (/all-treatment-plans)
Lista geral com filtro por paciente

👤 Nome + CPF com link

📄 Arquivo anexado

✏️ Editar

🗑️ Apagar

➕ Criar Novo Plano

🗓️ Gestão de Agendamentos
➕ Novo / ✏️ Editar Agendamento (Modal)
👤 Busca paciente por CPF/nome

📅 Data, ⏰ Hora

🦷 Procedimentos (checklist + "Outro(s)")

🗒️ Observações

🏷️ Status (dropdown)

Ações:

💾 Salvar/Atualizar

🚫 Cancelar

📅 Todos os Agendamentos (/appointments)
📊 Tabela ordenada por data/hora

Colunas: Data, Hora, Paciente, Procedimento, Status, Ações

✏️ Editar

🗑️ Excluir

➕ Novo Agendamento

📂 Visualizar Prontuário (/view-record)
🔍 Busca de Paciente
Busca por nome ou CPF

Dropdown com sugestões

Botão “Buscar”

📄 Exibição do Prontuário
👤 Dados pessoais

🩺 Anamnese (última) + link para edição

❤️ Histórico de P.A.

📝 Planos de Tratamento

🗓️ Histórico de Agendamentos

🔄 Limpar Busca / Voltar

✨ Componentes e Funcionalidades Gerais
🧭 Navegação
🔗 Header: Links e logo

📱 Menu responsivo

🚪 Logout (alerta)

🦶 Rodapé
Copyright / Info de desenvolvimento

🖼️ Modal de Imagem
Ampliação de anexos

⚠️ Modal de Confirmação
Exclui dados após confirmação

🍞 Toasts
Notificações de sucesso, erro ou alerta

🎨 Interface
Tema escuro

Ícones e UI padronizados

Responsivo

Scroll personalizado
