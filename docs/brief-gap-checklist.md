# Checklist de complétion du brief

## Authentification
- [ ] Sélecteur de profil membre sur la page login
- [ ] Connexion par mot de passe après sélection du profil
- [ ] Flux reset password opérationnel en envoi réel

## Dashboard principal
- [ ] Page `/dashboard` avec synthèse Agenda/Todos/Finances
- [ ] Alertes rapides (chevauchements, retards)
- [ ] Redirection root vers dashboard pour utilisateur connecté

## Contacts clé
- [ ] Schéma `key_contacts` en base
- [ ] Section visible sur le dashboard principal
- [ ] CRUD dans Paramètres

## Finances
- [ ] Onglet Reporting
- [ ] Données annuelles consolidées
- [ ] Export CSV
- [ ] Export Excel
- [ ] Export PDF

## Notifications
- [ ] Intégration Resend réelle
- [ ] Templates email dédiés
- [ ] Routes cron sécurisées
- [ ] Journalisation `notification_log`

## Qualité
- [ ] Lint sans erreur
- [ ] Typecheck sans erreur
- [ ] Smoke test parcours critiques
