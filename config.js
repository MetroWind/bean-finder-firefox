class PayeeMatcher
{
    constructor()
    {
        this.pattern_payee = "";
        this.pattern_category = "";
        this.account_expanse = "";
        this.payee = "";
        this.description = "";
        this.uuid = crypto.randomUUID();
    }
}

class AccountChase
{
    constructor()
    {
        this.pattern_card_title = "";
        this.account_paying = "";
        this.uuid = crypto.randomUUID();
    }
}

class ConfigChase
{
    constructor()
    {
        this.accounts = [];
        this.payee_matchers = [];
    }
}

class Configuration
{
    constructor()
    {
        this.config_chase = new ConfigChase();
    }

    save()
    {
        let settings = {config: this};
        browser.storage.local.set(settings);
    }

    static load()
    {
        return browser.storage.local.get().then((kv) => {
            console.debug(kv.config);
            return Object.assign(new Configuration, kv.config);
        });
    }
}
