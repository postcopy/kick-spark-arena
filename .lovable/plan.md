

## Plano: Estender Trial do Usuário Odair para 30 Dias

### Usuário Identificado
- **Nome**: Odair
- **Email**: contato@sulsport.com.br
- **ID**: e897a354-b4a6-4988-9c47-a451697ef523
- **Trial atual expira em**: 20/01/2026 (já expirado)

---

### Ação a Executar

Atualizar o campo `trial_ends_at` para 30 dias a partir de hoje (26/01/2026).

**Nova data de expiração**: 25/02/2026

---

### Comando SQL

```sql
UPDATE profiles 
SET trial_ends_at = NOW() + INTERVAL '30 days' 
WHERE id = 'e897a354-b4a6-4988-9c47-a451697ef523';
```

---

### Resultado Esperado

O usuário Odair terá acesso completo ao sistema por mais 30 dias sem precisar assinar.

