Permet de transmettre les informations du titre qui est en train d'être joué sur VirtualDJ à une machine distante via un serveur websocket.

## Installation

```sh
pnpm install
```

## Utilisation

### Paramétrage

Copier `.env.example` en `.env` et renseigner les paramètres (définir une clé API commune).

### Serveur

Lancer le serveur :

```sh
pnpm socketserver

# Avec pm2
pm2 start server/server.js --name remote-virtualdj-info --node-args="--env-file=.env"
pm2 save
```

### Côté VirtualDJ

```sh
pnpm push
```

> Nécessite le plugin [NetworkControlPlugin](https://virtualdj.com/wiki/NetworkControlPlugin)

### Côté client(s)

```sh
pnpm pull
```

## Liens utiles

[Documentation VDJScript](https://virtualdj.com/manuals/virtualdj/appendix/vdjscriptverbs.html)
