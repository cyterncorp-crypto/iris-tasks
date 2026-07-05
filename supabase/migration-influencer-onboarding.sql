-- Onboarding do influenciador: preço de assinatura e conclusão do formulário inicial

alter table influencers
  add column if not exists subscription_price_rub integer
    check (subscription_price_rub is null or subscription_price_rub > 0);

alter table influencers
  add column if not exists onboarding_completed boolean not null default false;
