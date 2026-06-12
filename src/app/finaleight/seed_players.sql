-- 1. Enable the trigram extension for fuzzy text matching (typo tolerance)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create the players table
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- 3. Create an index to make fuzzy searching lightning fast
CREATE INDEX IF NOT EXISTS trgm_idx_player_name ON players USING gin (name gin_trgm_ops);

-- 4. Bulk insert the players
-- (You will expand this list to include all ~1,200 World Cup players)
INSERT INTO players (name) VALUES 
  ('Lionel Messi'),
  ('Julian Alvarez'),
  ('Lautaro Martinez'),
  ('Enzo Fernandez'),
  ('Kylian Mbappé'),
  ('Antoine Griezmann'),
  ('Olivier Giroud'),
  ('Ousmane Dembélé'),
  ('Harry Kane'),
  ('Jude Bellingham'),
  ('Phil Foden'),
  ('Bukayo Saka'),
  ('Cole Palmer'),
  ('Erling Haaland'),
  ('Martin Ødegaard'),
  ('Vinícius Júnior'),
  ('Rodrygo'),
  ('Raphinha'),
  ('Richarlison'),
  ('Endrick'),
  ('Kevin De Bruyne'),
  ('Romelu Lukaku'),
  ('Jeremy Doku'),
  ('Leandro Trossard'),
  ('Cristiano Ronaldo'),
  ('Bruno Fernandes'),
  ('Bernardo Silva'),
  ('Rafael Leão'),
  ('Diogo Jota'),
  ('Gonçalo Ramos'),
  ('Lamine Yamal'),
  ('Alvaro Morata'),
  ('Ferran Torres'),
  ('Dani Olmo'),
  ('Jamal Musiala'),
  ('Leroy Sané'),
  ('Kai Havertz'),
  ('Niclas Füllkrug'),
  ('Florian Wirtz'),
  ('Cody Gakpo'),
  ('Xavi Simons'),
  ('Memphis Depay'),
  ('Darwin Núñez'),
  ('Federico Valverde'),
  ('Luis Díaz'),
  ('James Rodríguez'),
  ('Alexander Isak'),
  ('Viktor Gyökeres'),
  ('Dejan Kulusevski'),
  ('Son Heung-min'),
  ('Mohamed Salah'),
  ('Sadio Mané'),
  ('Nicolas Jackson'),
  ('Christian Pulisic'),
  ('Folarin Balogun'),
  ('Santiago Giménez'),
  ('Jonathan David'),
  ('Alphonso Davies'),
  ('Youssef En-Nesyri'),
  ('Andrej Kramarić'),
  ('Luka Modrić'),
  ('Kaoru Mitoma')
-- If a player is accidentally inserted twice, ignore the duplicate:
ON CONFLICT (name) DO NOTHING;