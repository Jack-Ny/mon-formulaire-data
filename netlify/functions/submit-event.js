const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({ auth: process.env.GH_TOKEN });

const owner = "VOTRE_NOM_UTILISATEUR";
const repo = "VOTRE_NOM_REPO";

exports.handler = async (event) => {
  const data = JSON.parse(event.body);

  try {
    // 1. Sauvegarder l'image dans le dossier /uploads
    await octokit.repos.createOrUpdateFileContents({
      owner, repo,
      path: `uploads/${data.photoName}`,
      message: `Nouvelle photo: ${data.photoName}`,
      content: data.photoData
    });

    // 2. Récupérer le fichier data.json existant
    let sha, currentContent = [];
    try {
      const res = await octokit.repos.getContent({ owner, repo, path: "data.json" });
      sha = res.data.sha;
      currentContent = JSON.parse(Buffer.from(res.data.content, "base64").toString());
    } catch (e) { /* Le fichier n'existe pas encore */ }

    // 3. Ajouter la nouvelle entrée
    const newEntry = {
      nom: data.nom,
      prenom: data.prenom,
      phone: data.phone,
      photoUrl: `/uploads/${data.photoName}`,
      date: new Date().toISOString()
    };
    currentContent.push(newEntry);

    // 4. Mettre à jour data.json
    await octokit.repos.createOrUpdateFileContents({
      owner, repo,
      path: "data.json",
      message: "Nouvelle inscription",
      content: Buffer.from(JSON.stringify(currentContent, null, 2)).toString("base64"),
      sha
    });

    return { statusCode: 200, body: "Succès" };
  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};
