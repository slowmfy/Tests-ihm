# Noms des Binomes 

CHEIKH Mohamed Amine - Benkhennouch Dihya


# Tests-ihm — Tests d'IHM de SauceDemo avec un DSL et Playwright

M1 MIAGE — Système testé : <https://www.saucedemo.com>

## Binôme

- NOM Prénom — *(à compléter)*
- NOM Prénom — *(à compléter)*

## Lancer les tests

```bash
npm install
npx playwright install chromium
npm test                 # toute la suite (headless)
npm run test:headed      # en voyant le navigateur
npm run report           # rapport HTML
```

## Organisation du dépôt

| Fichier | Rôle |
|---|---|
| [src/dsl/domaine.ts](src/dsl/domaine.ts) | Concepts du domaine : utilisateurs, produits + prix de référence, tris, écrans, messages d'erreur, calcul des montants attendus |
| [src/dsl/SauceDemo.ts](src/dsl/SauceDemo.ts) | **Le DSL** : interface TypeScript (actions + perceptions) |
| [src/dsl/PlaywrightSauceDemo.ts](src/dsl/PlaywrightSauceDemo.ts) | **L'interpréteur** du DSL, implémenté avec Playwright |
| [src/fixtures.ts](src/fixtures.ts) | Fixture Playwright qui injecte `moi: SauceDemo` dans chaque test |
| [tests/](tests/) | Les cas de test, un fichier par tâche utilisateur |

---

## 1. Description du DSL

### Niveau d'abstraction

Le DSL est écrit au niveau des **tâches** et des **concepts** de l'utilisateur, pas au niveau des widgets.
Un test ne contient ni sélecteur, ni URL, ni « cliquer sur le bouton ». Il se lit comme un scénario :

```ts
await moi.seConnecter('standard_user');
await moi.ajouterAuPanier('Sauce Labs Backpack');
await moi.pastillePanierIndique(1);
```

Les tests reçoivent seulement l'objet `moi`, typé par l'**interface** `SauceDemo`. Ils n'ont pas accès à la `page` Playwright, donc ils ne peuvent pas descendre au niveau technique.

### Concepts (dans [domaine.ts](src/dsl/domaine.ts))

| Concept | Représentation |
|---|---|
| Utilisateur | `Utilisateur` (les 6 comptes fournis) + mot de passe |
| Produit | `Produit` : union des 6 noms. Une faute de frappe sur un nom de produit est donc une erreur de compilation |
| Catalogue de référence | `CATALOGUE` : produit → prix attendu (oracle) |
| Tri | `'nom A-Z' \| 'nom Z-A' \| 'prix croissant' \| 'prix décroissant'` |
| Écran | `'connexion' \| 'catalogue' \| 'fiche produit' \| 'panier' \| 'informations client' \| 'récapitulatif' \| 'confirmation'` |
| Client | `InfosClient { prenom, nom, codePostal }` |
| Montants | `montantsAttendus(produits)` : sous-total, taxe 8 %, total (oracle) |
| Erreurs | `ERREURS` : messages attendus |

### Tâches → actions

| Tâche | Actions du DSL |
|---|---|
| S'authentifier | `ouvrirLeSite()`, `seConnecter(u, mdp?)`, `seDeconnecter()`, `accederDirectementA(ecran)` |
| Parcourir le catalogue | `trierCatalogue(tri)`, `consulterProduit(p)`, `revenirAuCatalogue()` |
| Gérer son panier | `ajouterAuPanier(...p)`, `retirerDuPanier(...p)`, `ouvrirLePanier()`, `continuerMesAchats()`, `reinitialiserApplication()` |
| Passer commande | `commencerLaCommande()`, `renseignerMesInformations(infos)`, `annulerLaCommande()`, `validerLaCommande()`, `acheter(produits, infos?)` (macro-tâche) |

`ajouterAuPanier` et `retirerDuPanier` agissent **depuis l'écran courant** (catalogue, fiche ou panier), comme le ferait l'utilisateur. Le test n'a pas à savoir que le bouton se trouve ailleurs selon l'écran.

### Perceptions (ce que l'utilisateur voit)

| Perception | Signification |
|---|---|
| `estSurEcran(e)` | L'utilisateur est sur l'écran `e` |
| `voitLErreur(msg)` / `neVoitAucuneErreur()` | Message d'erreur affiché ou non |
| `pastillePanierIndique(n)` | La pastille du panier indique `n` (pas de pastille si `n = 0`) |
| `panierContientExactement(ps)` | Le panier contient exactement ces produits (ordre indifférent) |
| `produitEstMarqueAjoute(p, oui?)` | Le produit est signalé « dans le panier » (bouton *Remove*) sur l'écran courant |
| `catalogueAfficheProduits(n)` | Le catalogue présente `n` produits |
| `catalogueEstTrie(tri)` | Le catalogue est ordonné selon `tri` |
| `prixAfficheEstCorrect(p)` | Le prix affiché est celui du catalogue de référence |
| `ficheAfficheProduit(p)` | La fiche produit présente `p` |
| `recapitulatifCorrespondA(ps)` | Sous-total, taxe et total sont justes pour les produits `ps` |
| `commandeEstConfirmee()` | Le message de confirmation est affiché |

Les perceptions sont des **assertions** : elles attendent automatiquement (auto-wait de Playwright) puis échouent si ce qui est attendu n'est pas observé.

### Stratégie d'implémentation du DSL (l'interpréteur)

- **Interface + une implémentation** : `SauceDemo` (interface) ← `PlaywrightSauceDemo` (interpréteur). On pourrait écrire une autre implémentation, par exemple une version API ou Selenium, sans toucher aux tests.
- **Un seul endroit connaît l'IHM.** Sélecteurs, URL et libellés de boutons sont regroupés dans `PlaywrightSauceDemo`. Si l'IHM change, on ne modifie que ce fichier.
- **Sélecteurs robustes.** On utilise en priorité les attributs `data-test` (`testIdAttribute: 'data-test'`) et les rôles ARIA (`getByRole('button', { name: 'Add to cart' })`). On utilise les classes CSS seulement quand il n'y a rien d'autre.
- **Localisation par concept.** Un produit est retrouvé par son *nom* : on prend la carte ou la ligne qui contient ce nom exact, puis le bouton à l'intérieur. Ce n'est pas un identifiant technique propre au produit.
- **Correspondance écran → URL** dans une table `CHEMINS`, et **tri → valeur du select** dans `VALEURS_TRI`.
- **Oracles calculés** à partir du domaine (prix de référence, taxe à 8 %). Les montants attendus ne sont pas recopiés depuis l'IHM.
- **Injection par fixture Playwright** (`test.extend<{ moi: SauceDemo }>`) : chaque test a son propre navigateur et son propre état.

---

## 2. Stratégie de production des cas de test

1. **Prise en main** : exploration manuelle du site avec chaque compte, et repérage des tâches (s'authentifier, parcourir, gérer le panier, commander) et des concepts.
2. **Découpage par tâche** : un fichier de test par tâche. Chaque tâche a au moins un **parcours nominal**.
3. **Partition en classes d'équivalence** des entrées utilisateur, avec **un représentant par classe**. Pour la connexion : vide / mot de passe faux / utilisateur inconnu / compte bloqué. Pour le formulaire client : un seul champ manquant à la fois. Ces cas sont *data-driven* : un tableau de cas et une boucle.
4. **Valeurs aux bornes** sur la cardinalité du panier : 0 produit, 1 produit, les 6 produits.
5. **Couverture des transitions d'état** du panier. On couvre chaque transition au moins une fois : ajout depuis le catalogue, ajout depuis la fiche, retrait depuis le catalogue, la fiche et le panier, navigation, déconnexion / reconnexion, réinitialisation, commande validée (qui vide le panier).
6. **Invariants de cohérence entre vues** : pastille = contenu du panier = boutons *Remove* sur le catalogue et la fiche.
7. **Règles métier avec oracle** : prix de référence, ordre de tri (4 tris), calcul sous-total / taxe 8 % / total sur plusieurs paniers.
8. **Navigation et sécurité** : accès direct par URL sans être connecté, et après déconnexion. Annulation à chaque étape de la commande.
9. **Robustesse avec les comptes « piégés »** (`problem_user`, `performance_glitch_user`). Les défauts connus sont documentés par des tests marqués `test.fail(...)` : le test est *vert* tant que le défaut existe et deviendra *rouge* (signal) quand le défaut sera corrigé.

## 3. Liste des scénarios

| ID | Scénario | Test TypeScript | Raison d'être |
|---|---|---|---|
| A1 | Un utilisateur standard se connecte et voit le catalogue (6 produits, panier vide) | [authentification.spec.ts](tests/authentification.spec.ts) `A1` | Parcours nominal |
| A2 | Connexion refusée : identifiant vide | `A2` (tableau `casInvalides`) | Classe d'équivalence invalide |
| A3 | Connexion refusée : mot de passe vide | `A3` | Classe d'équivalence invalide |
| A4 | Connexion refusée : mot de passe erroné | `A4` | Classe d'équivalence invalide |
| A5 | Connexion refusée : utilisateur inconnu | `A5` | Classe d'équivalence invalide |
| A6 | Connexion refusée : compte bloqué | `A6` | Classe d'équivalence invalide (règle métier) |
| A7 | Accès direct au catalogue sans connexion → refus | `A7` | Navigation / sécurité |
| A8 | Après déconnexion, accès direct au panier → refus | `A8` | Transition déconnexion + sécurité |
| A9 | `performance_glitch_user` finit par accéder au catalogue | `A9` | Robustesse (lenteur) |
| C1 | Chaque produit est affiché au bon prix | [catalogue.spec.ts](tests/catalogue.spec.ts) `C1` | Oracle métier |
| C2.1–4 | Tri par nom A-Z, Z-A, prix croissant, prix décroissant | `C2.x` (boucle sur `tris`) | Couverture de toutes les valeurs du tri |
| C3 | La fiche produit présente le bon produit, retour au catalogue | `C3` | Parcours nominal |
| C4 | Le tri est conservé après consultation d'une fiche | `C4` | Transition d'état (persistance du tri) |
| C5 | *[défaut connu]* `problem_user` ne peut pas trier | `C5` (`test.fail`) | Robustesse / détection de défaut |
| P1 | Ajouter un produit depuis le catalogue | [panier.spec.ts](tests/panier.spec.ts) `P1` | Nominal + borne 1 |
| P2 | Ajouter tous les produits | `P2` | Borne haute (6) |
| P3 | Retirer depuis le catalogue → panier vide | `P3` | Borne basse (0) + transition retrait |
| P4 | Ajouter depuis la fiche, retirer depuis le panier | `P4` | Autres transitions ajout / retrait |
| P5 | Cohérence catalogue / fiche / panier | `P5` | Invariant entre vues |
| P6 | Le panier est conservé après déconnexion / reconnexion | `P6` | Transition de session |
| P7 | Réinitialiser l'application vide le panier | `P7` | Transition réinitialisation |
| P8 | *[défaut connu]* après réinitialisation, les boutons restent « Remove » | `P8` (`test.fail`) | Invariant entre vues : défaut détecté |
| P9 | *[défaut connu]* `problem_user` ne peut pas ajouter certains produits | `P9` (`test.fail`) | Robustesse |
| O1 | Acheter un produit (parcours complet) puis panier vide | [commande.spec.ts](tests/commande.spec.ts) `O1` | Parcours nominal de bout en bout |
| O2.1–3 | Récapitulatif juste pour 1, 2 et 6 produits | `O2.x` (boucle sur `paniers`) | Oracle métier (taxe 8 %) + bornes |
| O3.1–3 | Commande bloquée si prénom / nom / code postal manquant | `O3.x` (tableau `champsManquants`) | Classes d'équivalence invalides |
| O4 | Annuler à la saisie des informations → panier intact | `O4` | Transition annulation |
| O5 | Annuler au récapitulatif → catalogue, panier conservé | `O5` | Transition annulation |
| O6 | *[défaut connu]* `problem_user` ne peut pas finaliser une commande | `O6` (`test.fail`) | Robustesse |

---

## 4. Outillage et usage des LLM / agents
