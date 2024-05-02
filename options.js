// Configuration format:
//
// {
//     "accounts_chase": [{
//         "pattern_card_title": "",
//         "account_paying": "",
//         "payee_matchers": [{
//             "pattern_payee": "",
//             "pattern_category": "",
//             "account_expanse": ""
//         }]
//     }]
// }

let e = React.createElement;

function LabeledInput({label, initial_text, on_change})
{
    const [value, setValue] = React.useState(initial_text);
    function onChange(e)
    {
        setValue(e.target.value);
        on_change(e.target.value);
    }

    return e(React.Fragment, {},
             e("div", {className: "Label"}, label),
             e("div", {className: "TextInputCell"},
               e("input", {className: "TextInput", type: "text", value: value,
                           onChange: onChange})));
}

function Dialog({show, children})
{
    function style()
    {
        let s = {position: "fixed", left: 0, top: 0, width: "100%", height: "100%", backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 100};
        if(show)
        {
            s["display"] = "block";
            return s;
        }
        else
        {
            s["display"] = "none";
            return s;
        }
    }

    return e("div", {className: "DialogWrapper", style: style()},
             e("div", {className: "Dialog"}, children));
}

function PayeeMatcherView({matcher, onRemove})
{
    function onPayeePatternChange(new_value)
    {
        matcher.pattern_payee = new_value;
    }
    function onCategoryPatternChange(new_value)
    {
        matcher.pattern_category = new_value;
    }
    function onAccountChange(new_value)
    {
        matcher.account_expanse = new_value;
    }
    function onPayeeChange(new_value)
    {
        matcher.payee = new_value;
    }
    function onDescChange(new_value)
    {
        matcher.description = new_value;
    }

    return e("div", {className: "PayeeMatcher LabeledPanel"},
             e("h3", {}, "Record matcher"),
             e("div", {className: "LabeledInputGroup"},
               e(LabeledInput, {label: "Payee pattern",
                                initial_text: matcher.pattern_payee,
                                on_change: onPayeePatternChange}),
               e(LabeledInput, {label: "Category pattern",
                                initial_text: matcher.pattern_category,
                                on_change: onCategoryPatternChange}),
               e(LabeledInput, {label: "Beancount account",
                                initial_text: matcher.account_expanse,
                                on_change: onAccountChange}),
               e(LabeledInput, {label: "Payee",
                                initial_text: matcher.payee,
                                on_change: onPayeeChange}),
               e(LabeledInput, {label: "Description",
                                initial_text: matcher.description,
                                on_change: onDescChange})),
             e("div", {className: "ButtonRowLeft"},
               e("button", {onClick: onRemove}, "🗑️ Remove matcher")));
}

function ChaseAccountView({account, onRemove})
{
    const [acc, setAccount] = React.useState(account);

    function onTitlePatternChange(new_value)
    {
        acc.pattern_card_title = new_value;
    }

    function onPayingAccountChange(new_value)
    {
        new_account = Object.assign(new AccountChase, account);
        account.account_paying = new_value;
        new_account.account_paying = new_value;
        setAccount(new_account);
    }


    return e("div", {className: "LabeledPanel"},
             e("h3", {}, "Chase account for " + account.account_paying),
             e("div", {className: "LabeledInputGroup"},
               e(LabeledInput, {label: "Account title pattern",
                                initial_text: account.pattern_card_title,
                                on_change: onTitlePatternChange}),
               e(LabeledInput, {label: "Beancount paying account",
                                initial_text: account.account_paying,
                                on_change: onPayingAccountChange})),
             e("div", {className: "ButtonRowLeft"},
               e("button", {onClick: onRemove}, "🗑️ Remove account")));
}

function ChaseConfigView({config})
{
    const [conf, setConf] = React.useState(config);

    function onClickBtnAddAccount()
    {
        newconf = Object.assign(new ConfigChase, conf);
        newconf.accounts.push(new AccountChase());
        setConf(newconf);
    }

    function onRemoveAccount(uuid)
    {
        newconf = Object.assign(new ConfigChase, conf);
        let i = newconf.accounts.findIndex((item) => item.uuid == uuid);
        newconf.accounts.splice(i, 1);
        setConf(newconf);
    }

    function onClickBtnAddMatcher()
    {
        newconf = Object.assign(new ConfigChase, conf);
        newconf.payee_matchers.push(new PayeeMatcher());
        setConf(newconf);
    }

    function onRemoveMatcher(uuid)
    {
        newconf = Object.assign(new ConfigChase, conf);
        let i = newconf.payee_matchers.findIndex((item) => item.uuid == uuid);
        newconf.payee_matchers.splice(i, 1);
        setConf(newconf);
    }

    var accounts = conf.accounts.map((acc) => {
        return e("li", {key: acc.uuid},
          e(ChaseAccountView,
            {account: acc,
             onRemove: () => onRemoveAccount(acc.uuid)}));
    });
    var matchers = conf.payee_matchers.map((matcher) =>
        e("li", {key: matcher.uuid},
          e(PayeeMatcherView,
            {matcher: matcher,
             onRemove: () => onRemoveMatcher(matcher.uuid)})));
    return e("div",{},
             e("div", {className: "LabeledPanel"},
               e("h2", {}, "Chase accounts"),
               e("ul", {className: "NotList"}, accounts),
               e("div", {className: "ButtonRow"},
                 e("button", {onClick: onClickBtnAddAccount}, "➕ Add account"))),
             e("div", {className: "LabeledPanel"},
               e("h2", {}, "Record matchers"),
               e("ul", {className: "NotList"}, matchers),
               e("div", {className: "ButtonRow"},
                 e("button", {onClick: onClickBtnAddMatcher}, "➕ Add matcher"))));
}

function ConfigView({config})
{
    // State can be “normal”, “import”, “export”.
    const [state, setState] = React.useState("normal");

    function onClickBtnSave()
    {
        config.save();
    }

    function onClickBtnImport()
    {
        setState("import");
    }

    function onClickBtnExport()
    {
        setState("export");
    }

    function onClickBtnDoImport()
    {
        let TextImport = document.getElementById("TextConfigImport");
        Object.assign(config, JSON.parse(TextImport.value));
        config.save();
        window.location.reload();
    }

    function onClickBtnDoExport()
    {
        let config_json = document.getElementById("TextConfigExport");
        navigator.clipboard.writeText(config_json.value).then(
            () => {
                /* clipboard successfully set */
            },
            () => {
                /* clipboard write failed */
            },
        );
    }

    function onClickBtnCloseExport()
    {
        setState("normal");
    }

    function onClickBtnCloseImport()
    {
        document.getElementById("TextConfigImport").value = "";
        setState("normal");
    }

    return e("div", {},
             e(Dialog, {show: state == "import"},
               e("div", {className: "RaisedPanel"},
                 e("p", {}, "Config JSON:"),
                 e("textarea", {id: "TextConfigImport"}),
                 e("div", {className: "ButtonRow"},
                   e("button", {onClick: onClickBtnCloseImport}, "Close"),
                   e("button", {onClick: onClickBtnDoImport}, "Import!")))),
             e(Dialog, {show: state == "export"},
               e("div", {className: "RaisedPanel"},
                 e("p", {}, "Config JSON:"),
                 e("textarea", {readOnly: true,
                                id: "TextConfigExport",
                                value:JSON.stringify(config, null, 2)}),
                 e("div", {className: "ButtonRow"},
                   e("button", {onClick: onClickBtnCloseExport}, "Close"),
                   e("button", {onClick: onClickBtnDoExport}, "Copy!")))),
             e("div", {className: "Window"},
               e("div", {className: "Toolbar"},
                 e("button", {className: "IconButton FloatButton",
                              title: "Import...",
                              onClick: onClickBtnImport}, "📂"),
                 e("button", {className: "IconButton FloatButton",
                              title: "Export...",
                              onClick: onClickBtnExport}, "⤵️")),
               e("h1", {}, "Chase configuration"),
               e(ChaseConfigView, {config: config.config_chase}),
               e("hr", {}),
               e("div", {className: "ButtonRow"},
                 e("button", {onClick: onClickBtnSave}, "💾 Save"))));
}

Configuration.load().then((conf) => {
    let body = ReactDOM.createRoot(document.getElementById('body'));
    body.render(e(ConfigView, {config: conf}));
});
