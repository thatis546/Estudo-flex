const ROADMAP={
  Explorando:["Cumprimentos e despedidas","Apresentação pessoal","Pronomes básicos","Verbos essenciais","Perguntas simples"],
  Descobrindo:["Presente e rotina","Vocabulário cotidiano","Compreensão de frases curtas","Respostas guiadas","Primeiras situações reais"],
  Construindo:["Narrar experiências","Dar opiniões","Conectar ideias","Expandir vocabulário","Aumentar autonomia"],
  Conectando:["Naturalidade","Registro formal e informal","Cultura e regionalismos","Argumentação","Precisão gramatical"],
  "Vivendo o idioma":["Nuance e estilo","Comunicação profissional avançada","Humor e cultura","Apresentações complexas","Aprimoramento contínuo"]
};
export const getRoadmap=(journey="Explorando")=>({journey,fundamentals:ROADMAP[journey]||ROADMAP.Explorando});
export const getNextFundamental=({journey,completed=[]}={})=>getRoadmap(journey).fundamentals.find(x=>!completed.includes(x))||null;
