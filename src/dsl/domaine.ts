/**
 * Concepts du domaine SauceDemo (vocabulaire du DSL).
 * Aucune notion technique (sélecteur, URL, clic) n'apparaît ici.
 */

/** Utilisateurs fournis par le système (mot de passe commun : secret_sauce). */
export type Utilisateur =
  | 'standard_user'
  | 'locked_out_user'
  | 'problem_user'
  | 'performance_glitch_user'
  | 'error_user'
  | 'visual_user';

export const MOT_DE_PASSE_VALIDE = 'secret_sauce';

/** Catalogue de référence : produit -> prix attendu (en $). */
export const CATALOGUE = {
  'Sauce Labs Backpack': 29.99,
  'Sauce Labs Bike Light': 9.99,
  'Sauce Labs Bolt T-Shirt': 15.99,
  'Sauce Labs Fleece Jacket': 49.99,
  'Sauce Labs Onesie': 7.99,
  'Test.allTheThings() T-Shirt (Red)': 15.99,
} as const;

export type Produit = keyof typeof CATALOGUE;
export const TOUS_LES_PRODUITS = Object.keys(CATALOGUE) as Produit[];

/** Taux de taxe appliqué au récapitulatif de commande. */
export const TAUX_TAXE = 0.08;

export type Tri = 'nom A-Z' | 'nom Z-A' | 'prix croissant' | 'prix décroissant';

/** Les « écrans » du système, vus par l'utilisateur. */
export type Ecran =
  | 'connexion'
  | 'catalogue'
  | 'fiche produit'
  | 'panier'
  | 'informations client'
  | 'récapitulatif'
  | 'confirmation';

export interface InfosClient {
  prenom: string;
  nom: string;
  codePostal: string;
}

export const CLIENT_TYPE: InfosClient = { prenom: 'Ada', nom: 'Lovelace', codePostal: '38000' };

/** Messages d'erreur du système (perçus par l'utilisateur). */
export const ERREURS = {
  identifiantRequis: 'Epic sadface: Username is required',
  motDePasseRequis: 'Epic sadface: Password is required',
  identifiantsInvalides: 'Epic sadface: Username and password do not match any user in this service',
  compteBloque: 'Epic sadface: Sorry, this user has been locked out.',
  accesNonAutorise: (chemin: string) => `Epic sadface: You can only access '${chemin}' when you are logged in.`,
  prenomRequis: 'Error: First Name is required',
  nomRequis: 'Error: Last Name is required',
  codePostalRequis: 'Error: Postal Code is required',
} as const;

/** Montants attendus pour une commande, calculés à partir du catalogue de référence. */
export function montantsAttendus(produits: Produit[]) {
  const sousTotal = Math.round(produits.reduce((s, p) => s + CATALOGUE[p] * 100, 0)) / 100;
  const taxe = Math.round(sousTotal * TAUX_TAXE * 100) / 100;
  const total = Math.round((sousTotal + taxe) * 100) / 100;
  return { sousTotal, taxe, total };
}
