import { db } from "./db"

async function createTrigger() {
  try {
    // SQL para criar a função do trigger
    await db.$executeRaw`
      CREATE OR REPLACE FUNCTION update_current_value() 
      RETURNS TRIGGER AS $$
      BEGIN
        UPDATE account
        SET currentValue = (
          SELECT COALESCE(SUM(value), 0)
          FROM transaction
          WHERE accountId = NEW.accountId
        )
        WHERE id = NEW.accountId;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // SQL para criar o trigger
    await db.$executeRaw`
      CREATE TRIGGER after_transaction_insert
      AFTER INSERT ON transaction
      FOR EACH ROW
      EXECUTE FUNCTION update_current_value();
    `;

    console.log("Trigger criado com sucesso!");
  } catch (error) {
    console.error("Erro ao criar trigger:", error);
  }
}

// Executa a criação do trigger
createTrigger().finally(async () => {
  await db.$disconnect();
});