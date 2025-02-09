module suipump::suipump {
    use std::type_name;
    use std::ascii::{String, Self};

    use sui::{math, event};
    use sui::sui::{ SUI };
    use sui::coin::{
        Coin,
        Self,
        TreasuryCap,
        CoinMetadata
    };
    use sui::clock::{Self, Clock};
    use sui::balance::{Self, Balance};

    use cetus_clmm::factory::{Self, Pools};
    use cetus_clmm::config::{ GlobalConfig };
    use cetus_clmm::position::{ Position };

    // === Constants ===
    // https://github.com/movescriptions/movescriptions/blob/main/sui/sources/movescription_to_amm.move#L22
    const CETUS_TICK_SPACING: u32 = 200;
    const CETUS_MIN_TICK_U32: u32 = 4294523696;
    const CETUS_MAX_TICK_U32: u32 = 443600;

    // === Structs ===
    public struct AdminCap has store, key {
        id: UID,
    }

    public struct Configuration has store, key {
        id: UID,
        admin_addr: address,
        platform_fee: u64,
        graduated_fee: u64,
        initial_virtual_sui_reserves: u64,
        initial_virtual_token_reserves: u64,
        remain_token_reserves: u64,
    }

    public struct Pool<phantom TokenType> has store, key {
        id: UID,
        img_url: String,
        real_sui_reserves: Balance<SUI>,
        real_token_reserves: Balance<TokenType>,
        virtual_token_reserves: u64,
        virtual_sui_reserves: u64,
        remain_token_reserves: Balance<TokenType>,
        is_completed: bool
    }

    // === Events ===
    public struct AdminConfigChanged has copy, drop {
        old_admin_addr: address,
        new_admin_addr: address,
        ts: u64
    }

    public struct ConfigChanged has copy, drop {
        old_platform_fee: u64,
        new_platform_fee: u64,
        old_graduated_fee: u64,
        new_graduated_fee: u64,
        old_initial_virtual_sui_reserves: u64,
        new_initial_virtual_sui_reserves: u64,
        old_initial_virtual_token_reserves: u64,
        new_initial_virtual_token_reserves: u64,
        old_remain_token_reserves: u64,
        new_remain_token_reserves: u64,
        ts: u64
    }

    public struct Created has copy, drop {
        name: std::string::String,
        symbol: String,
        uri: String,
        description: std::string::String,
        twitter: String,
        telegram: String,
        website: String,
        token_address: String,
        bonding_curve: address,
        created_by: address,
        virtual_sui_reserves: u64,
        virtual_token_reserves: u64,
        ts: u64
    }

    public struct Traded has copy, drop {
        is_buy: bool,
        user: address,
        token_address: String,
        sui_amount: u64,
        token_amount: u64,
        virtual_sui_reserves: u64,
        virtual_token_reserves: u64,
        pool_id: ID,
        ts: u64
    }

    public struct PoolCompleted has copy, drop {
        token_address: String,
        lp: String,
        ts: u64
    }

    // === Error codes ===
    const ETWITTER_TOO_LONG: u64 = 69002;
    const ETELEGRAM_NAME_TOO_LONG: u64 = 69003;
    const EWEBSITE_NAME_TOO_LONG: u64 = 69004;
    const EPOOL_COMPLETED: u64 = 69006;
    const EOUTPUT_TOO_SMALL: u64 = 69007;
    const EMAX_INPUT_TOO_SMALL: u64 = 69008;
    const EINPUT_TOO_SMALL: u64 = 69009;
    const EMIN_OUTPUT_TOO_LARGE: u64 = 69010;
    const EEMPTY_AMOUNT_IN: u64 = 69011;
    const EINCORRECT_SWAP: u64 = 69012;
    const ETOKEN_ALREADY_MINTED: u64 = 69015;

    fun init(ctx: &mut TxContext) {
        transfer::transfer(
            AdminCap {id: object::new(ctx)},
            ctx.sender()
        );

        transfer::share_object(
            Configuration {
                id: object::new(ctx),
                admin_addr: ctx.sender(),
                platform_fee: 100, // 1%
                graduated_fee: 150_000_000_000, // 150 SUI
                initial_virtual_sui_reserves: 1_500_000_000_000, // 1500 SUI
                initial_virtual_token_reserves: 1_000_000_000_000_000, // 1 billion
                remain_token_reserves: 200_000_000_000_000, // 200 million
            }
        );
    }

    // === Public entries ===
    public entry fun transfer_admin(
        admin_cap: AdminCap,
        config: &mut Configuration,
        new_admin_addr: address,
        clock: &Clock,
    ) {
        transfer::public_transfer(admin_cap, new_admin_addr);

        event::emit(
            AdminConfigChanged {
                old_admin_addr: config.admin_addr,
                new_admin_addr,
                ts: clock::timestamp_ms(clock),
            }
        );

        config.admin_addr = new_admin_addr;
    }

    public entry fun update_config(
        _: &mut AdminCap,
        config: &mut Configuration,
        new_platform_fee: u64,
        new_graduated_fee: u64,
        new_initial_virtual_sui_reserves: u64,
        new_initial_virtual_token_reserves: u64,
        new_remain_token_reserves: u64,
        clock: &Clock,
    ) {
        event::emit<ConfigChanged>(
            ConfigChanged {
                old_platform_fee: config.platform_fee,
                new_platform_fee,
                old_graduated_fee: config.graduated_fee,
                new_graduated_fee,
                old_initial_virtual_sui_reserves: config.initial_virtual_sui_reserves,
                new_initial_virtual_sui_reserves,
                old_initial_virtual_token_reserves: config.initial_virtual_token_reserves,
                new_initial_virtual_token_reserves,
                old_remain_token_reserves: config.remain_token_reserves,
                new_remain_token_reserves,
                ts: clock::timestamp_ms(clock),
            }
        );

        config.platform_fee = new_platform_fee;
        config.graduated_fee = new_graduated_fee;
        config.initial_virtual_sui_reserves = new_initial_virtual_sui_reserves;
        config.initial_virtual_token_reserves = new_initial_virtual_token_reserves;
        config.remain_token_reserves = new_remain_token_reserves;
    }

    #[allow(lint(share_owned))]
    public entry fun create<TokenType>(
        config: &mut Configuration,
        treasury_cap: TreasuryCap<TokenType>,
        coin_metadata: &CoinMetadata<TokenType>,
        clock: &Clock,
        twitter: String,
        telegram: String,
        website: String,
        ctx: &mut TxContext
    ) {
        let pool = internal_create(
            config,
            treasury_cap,
            coin_metadata,
            clock,
            twitter,
            telegram,
            website,
            ctx
        );
        transfer::public_share_object(pool);
    }

    #[allow(lint(share_owned))]
    public entry fun create_and_buy<TokenType>(
        config: &mut Configuration,
        treasury_cap: TreasuryCap<TokenType>,
        coin_metadata: &CoinMetadata<TokenType>,
        clock: &Clock,
        twitter: String,
        telegram: String,
        website: String,
        sui_in: &mut Coin<SUI>,
        max_sui_in: u64,
        token_out: u64,
        cetus_pools: &mut Pools,
        cetus_config: &GlobalConfig,
        ctx: &mut TxContext
    ) {
        let mut pool = internal_create<TokenType>(
            config,
            treasury_cap,
            coin_metadata,
            clock,
            twitter,
            telegram,
            website,
            ctx
        );
        buy<TokenType>(
            config,
            &mut pool,
            sui_in,
            max_sui_in,
            token_out,
            cetus_pools,
            cetus_config,
            clock,
            ctx
        );
        transfer::public_share_object(pool);
    }

    public entry fun buy<TokenType>(
        config: &mut Configuration,
        pool: &mut Pool<TokenType>,
        sui_in: &mut Coin<SUI>,
        max_sui_in: u64,
        token_amount: u64,
        cetus_pools: &mut Pools,
        cetus_config: &GlobalConfig,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(!pool.is_completed, EPOOL_COMPLETED);
        assert!(token_amount > 0, EOUTPUT_TOO_SMALL);

        let token_reserves = pool.virtual_token_reserves - pool.remain_token_reserves.value();
        let token_amount = math::min(token_amount, token_reserves);
        let sui_amount = get_amount_in(
            token_amount,
            pool.virtual_sui_reserves,
            pool.virtual_token_reserves
        );

        let sui_fee_amount = sui_amount / config.platform_fee;

        assert!(
            max_sui_in >= sui_amount + sui_fee_amount,
            EMAX_INPUT_TOO_SMALL
        );

        let (swapped_token, empty_sui_balance) = swap<TokenType>(
            pool,
            balance::zero<TokenType>(),
            coin::into_balance(sui_in.split(sui_amount, ctx)),
            token_amount,
            0
        );

        transfer::public_transfer<Coin<SUI>>(
            sui_in.split<SUI>(sui_fee_amount, ctx),
            config.admin_addr
        );
        balance::destroy_zero(empty_sui_balance);
        transfer::public_transfer<Coin<TokenType>>(
            coin::from_balance(swapped_token, ctx),
            ctx.sender()
        );

        if (token_reserves == token_amount) {
            transfer_pool<TokenType>(
                pool,
                cetus_pools,
                cetus_config,
                config.graduated_fee,
                config.admin_addr,
                clock,
                ctx
            );
        };

        event::emit<Traded>(
            Traded {
                is_buy: true,
                user: ctx.sender(),
                token_address: type_name::get<TokenType>().into_string(),
                sui_amount,
                token_amount,
                virtual_sui_reserves: pool.virtual_sui_reserves,
                virtual_token_reserves: pool.virtual_token_reserves,
                pool_id: object::id<Pool<TokenType>>(pool),
                ts: clock::timestamp_ms(clock),
            }
        );
    }

    public entry fun sell<TokenType>(
        config: &mut Configuration,
        pool: &mut Pool<TokenType>,
        token_in: &mut coin::Coin<TokenType>,
        min_sui_out: u64,
        token_amount: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(!pool.is_completed, EPOOL_COMPLETED);
        assert!(token_amount > 0, EINPUT_TOO_SMALL);

        let sui_amount = get_amount_out(
            token_amount,
            pool.virtual_token_reserves,
            pool.virtual_sui_reserves
        );

        let sui_fee_amount = sui_amount / config.platform_fee;

        assert!(
            sui_amount - sui_fee_amount >= min_sui_out,
            EMIN_OUTPUT_TOO_LARGE
        );

        let (empty_token_balance, mut swapped_sui) = swap<TokenType>(
            pool,
            coin::into_balance(token_in.split(token_amount, ctx)),
            balance::zero<SUI>(),
            0,
            sui_amount
        );

        transfer::public_transfer<Coin<SUI>>(
            coin::from_balance(
                swapped_sui.split(sui_fee_amount),
                ctx
            ),
            config.admin_addr
        );
        balance::destroy_zero(empty_token_balance);
        transfer::public_transfer<Coin<SUI>>(
            coin::from_balance(swapped_sui, ctx),
            ctx.sender()
        );

        event::emit<Traded>(
            Traded {
                is_buy: false,
                user: ctx.sender(),
                token_address: type_name::get<TokenType>().into_string(),
                sui_amount,
                token_amount,
                virtual_sui_reserves: pool.virtual_sui_reserves,
                virtual_token_reserves: pool.virtual_token_reserves,
                pool_id: object::id<Pool<TokenType>>(pool),
                ts: clock::timestamp_ms(clock),
            }
        );
    }

    // === Internal ===
    fun internal_create<TokenType>(
        config: &Configuration,
        mut treasury_cap: TreasuryCap<TokenType>,
        coin_metadata: &CoinMetadata<TokenType>,
        clock: &Clock,
        twitter: String,
        telegram: String,
        website: String,
        ctx: &mut TxContext
    ): Pool<TokenType> {
        assert!(
            ascii::length(&twitter) <= 500,
            ETWITTER_TOO_LONG
        );
        assert!(
            ascii::length(&telegram) <= 500,
            ETELEGRAM_NAME_TOO_LONG
        );
        assert!(
            ascii::length(&website) <= 500,
            EWEBSITE_NAME_TOO_LONG
        );

        assert!(
            coin::total_supply(&treasury_cap) == 0,
            ETOKEN_ALREADY_MINTED
        );

        let real_token_reserves = coin::mint_balance<TokenType>(
            &mut treasury_cap,
            config.initial_virtual_token_reserves - config.remain_token_reserves
        );

        let remain_token_reserves = coin::mint_balance<TokenType>(
            &mut treasury_cap,
            config.remain_token_reserves
        );

        transfer::public_transfer<coin::TreasuryCap<TokenType>>(treasury_cap, @0x0);

        let pool = Pool<TokenType> {
            id: object::new(ctx),
            img_url: sui::url::inner_url(
                &option::destroy_some(coin::get_icon_url(coin_metadata))
            ),
            real_sui_reserves: balance::zero<SUI>(),
            real_token_reserves,
            virtual_token_reserves: config.initial_virtual_token_reserves,
            virtual_sui_reserves: config.initial_virtual_sui_reserves,
            remain_token_reserves,
            is_completed: false,
        };

        event::emit(
            Created {
                name: coin::get_name(coin_metadata),
                symbol: coin::get_symbol(coin_metadata),
                uri: pool.img_url,
                description: coin::get_description(coin_metadata),
                twitter,
                telegram,
                website,
                token_address: type_name::get<TokenType>().into_string(),
                bonding_curve: pool.id.to_address(),
                created_by: ctx.sender(),
                virtual_sui_reserves: config.initial_virtual_sui_reserves,
                virtual_token_reserves: config.initial_virtual_token_reserves,
                ts: clock::timestamp_ms(clock),
            }
        );
        pool
    }

    fun swap<TokenType>(
        pool: &mut Pool<TokenType>,
        token_in: Balance<TokenType>,
        sui_in: Balance<SUI>,
        token_out: u64,
        sui_out: u64
    ): (Balance<TokenType>, Balance<SUI>) {
        assert!(
            token_in.value() > 0 || sui_in.value() > 0,
            EEMPTY_AMOUNT_IN
        );

        let (vtr_before, vsr_before) = (
            pool.virtual_token_reserves,
            pool.virtual_sui_reserves
        );

        pool.virtual_token_reserves = pool.virtual_token_reserves - token_out;
        pool.virtual_sui_reserves = pool.virtual_sui_reserves - sui_out;
        pool.virtual_token_reserves = pool.virtual_token_reserves + token_in.value();
        pool.virtual_sui_reserves = pool.virtual_sui_reserves + sui_in.value();

        assert_lp_value_is_increased_or_not_changed(
            vtr_before,
            vsr_before,
            pool.virtual_token_reserves,
            pool.virtual_sui_reserves
        );

        pool.real_token_reserves.join(token_in);
        pool.real_sui_reserves.join(sui_in);

        let token_swapped = pool.real_token_reserves.split(token_out);
        let sui_swapped = pool.real_sui_reserves.split(sui_out);

        (token_swapped, sui_swapped)
    }

    fun transfer_pool<TokenType>(
        pool: &mut Pool<TokenType>,
        cetus_pools: &mut Pools,
        cetus_config: &GlobalConfig,
        graduated_fee: u64,
        admin_addr: address,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        pool.is_completed = true;

        // Extract fee and transfer to admin
        let sui_fee = pool.real_sui_reserves.split(graduated_fee);
        transfer::public_transfer<Coin<SUI>>(
            coin::from_balance(sui_fee, ctx),
            admin_addr
        );

        // Merge remaining tokens
        let real_token_balance = pool.remain_token_reserves.withdraw_all();
        let real_sui_balance = pool.real_sui_reserves.withdraw_all();

        //get amount of token to add liquidity
        let token_amount = real_token_balance.value();
        let sui_amount = real_sui_balance.value();

        // https://github.com/movescriptions/movescriptions/blob/main/sui/sources/movescription_to_amm.move#L64
        let (lp, token_remain, sui_remain) = factory::create_pool_with_liquidity<TokenType, SUI>(
            cetus_pools,
            cetus_config,
            CETUS_TICK_SPACING,
            price_to_sqrt_price_x64(token_amount, sui_amount, 6, 9), //10103697841695462096
            std::string::from_ascii(pool.img_url),
            CETUS_MIN_TICK_U32,
            CETUS_MAX_TICK_U32,
            coin::from_balance(real_token_balance, ctx),
            coin::from_balance(real_sui_balance, ctx),
            token_amount,
            sui_amount,
            true,
            clock,
            ctx
        );

        transfer::public_transfer<Coin<TokenType>>(token_remain, admin_addr);
        transfer::public_transfer<Coin<SUI>>(sui_remain, admin_addr);
        transfer::public_transfer<Position>(lp, @0x0);

        event::emit<PoolCompleted>(
            PoolCompleted {
                token_address: type_name::get<TokenType>().into_string(),
                lp: type_name::get<SUI>().into_string(),
                ts: clock::timestamp_ms(clock),
            }
        );
    }

    public entry fun create_pool_with_liquidity<TokenType, SUI>(
        arg0: &GlobalConfig, 
        arg1: &mut Pools, 
        arg4: std::string::String, 
        arg5: Coin<TokenType>,
        arg6: Coin<SUI>,   
        arg9: u64, //min amount T
        arg10: u64, //min amount SUI
        arg12: &Clock, 
        arg13: &mut TxContext
    ){
        let (lp, token_remain, sui_remain) = factory::create_pool_with_liquidity<TokenType, SUI>(
            arg1, 
            arg0, 
            CETUS_TICK_SPACING, 
            10103697841695462096, 
            arg4, 
            CETUS_MIN_TICK_U32,
            CETUS_MAX_TICK_U32,
            arg5, 
            arg6, 
            arg9, 
            arg10, 
            true, 
            arg12, 
            arg13
        );

        transfer::public_transfer<Coin<TokenType>>(token_remain,  @0x0);
        transfer::public_transfer<Coin<SUI>>(sui_remain,  @0x0);
        transfer::public_transfer<Position>(lp, @0x0);
    }

    fun assert_lp_value_is_increased_or_not_changed(
        x_before_swap: u64,
        y_before_swap: u64,
        x_after_swap: u64,
        y_after_swap: u64
    ) {
        assert!(
            (x_before_swap as u128) * (y_before_swap as u128) <= (x_after_swap as u128) * (
                y_after_swap as u128
            ),
            EINCORRECT_SWAP
        );
    }

    fun mul_div(x: u64, y: u64, z: u64): u64 {
        let r = (x as u128) * (y as u128) / (z as u128);
        (r as u64)
    }

    fun get_amount_in(
        amount_out: u64, // b
        reserve_in: u64, // x
        reserve_out: u64, // y
    ): u64 {
        //     (x * b)
        // a = -------
        //     (y - b)
        mul_div(
            reserve_in,
            amount_out,
            reserve_out - amount_out
        ) + 1
    }

    fun get_amount_out(
        amount_in: u64, // a
        reserve_in: u64, // x
        reserve_out: u64, // y
    ): u64 {
        //     (y * a)
        // b = -------
        //     (x + a)
        mul_div(
            reserve_out,
            amount_in,
            reserve_in + amount_in
        )
    }

    const POW_2_64: u128 = 18_446_744_073_709_551_616;
    const POW_10_18: u128 = 1_000_000_000_000_000_000;
    const POW_10_9: u128 = 1_000_000_000;
    fun price_to_sqrt_price_x64(
        amount_a: u64,
        amount_b: u64,
        decimals_a: u8,
        decimals_b: u8
    ): u128 {
        let a = (amount_a as u128);
        let b = (amount_b as u128);
        let decimal_diff = (
            math::diff(
                (decimals_a as u64),
                (decimals_b as u64)
            ) as u8
        );
        let sqrt_price = math::sqrt_u128(
            b * (math::pow(10, decimal_diff) as u128) * POW_10_18 / a
        ) * POW_2_64 / POW_10_9;
        sqrt_price
    }

    // === Tests ===
    // Test coin for simulating token operations
    #[test_only]
    use sui::test_scenario::{
        Self as test,
        Scenario,
        next_tx,
        ctx
    };

    #[test_only]
    public struct MOCK_TOKEN has drop {}

    #[test_only]
    const ADMIN: address = @0xA1;
    #[test_only]
    const USER1: address = @0xB1;
    #[test_only]
    const USER2: address = @0xC1;

    #[test_only]
    public fun initialize_config(ctx: &mut TxContext) {
        let config = Configuration {
            id: object::new(ctx),
            platform_fee: 100, // 0.5%
            graduated_fee: 300000000, // 300 SUI = 300000000
            initial_virtual_sui_reserves: 3000000000,
            initial_virtual_token_reserves: 10000000000000,
            remain_token_reserves: 2000000000000,
        };
        transfer::share_object(config);
    }

    #[test_only]
    fun test_setup(test: &mut Scenario) {
        next_tx(test, ADMIN);
        {
            initialize_config(ctx(test));
        }
    }

    #[test_only]
    fun create_mock_treasury_cap(
        witness: MOCK_TOKEN,
        test: &mut Scenario
    ): (
        TreasuryCap<MOCK_TOKEN>,
        &CoinMetadata<MOCK_TOKEN>
    ) {
        let (treasury_cap, metadata) = coin::create_currency(
            witness,
            9,
            b"MOCK",
            b"MOCK Token",
            b"A mock token for testing",
            option::none(),
            ctx(test)
        );

        transfer::public_freeze_object(metadata);
        (treasury_cap, &metadata)
    }

    #[test]
    fun test_init() {
        let mut scenario = test::begin(@0x1);
        test_setup(&mut scenario);

        next_tx(&mut scenario, ADMIN);
        {
            let config = test::take_shared<Configuration>(&scenario);
            assert!(config.platform_fee == 100, 0);
            assert!(config.graduated_fee == 300000000, 1);
            test::return_shared(config);
        };
        test::end(scenario);
    }

    #[test]
    fun create_pool_for_test() {
        let mut scenario = test::begin(@0x1);
        test_setup(&mut scenario);

        let _witness = MOCK_TOKEN {};
        let mut treasury_cap = create_mock_treasury_cap(_witness, &mut scenario);

        // let mut treasury_cap = test::take_from_sender<TreasuryCap<MOCK_TOKEN>>(&scenario);

        next_tx(&mut scenario, ADMIN);
        {
            let mut config = test::take_shared<Configuration>(&scenario);
            let clock = clock::create_for_testing(ctx(&mut scenario));

            create<MOCK_TOKEN>(
                &mut config,
                &mut treasury_cap,
                &clock,
                ascii::string(b"Mock Token"),
                ascii::string(b"MOCK"),
                ascii::string(b"mock_uri"),
                ascii::string(b"twitter"),
                ascii::string(b"telegram"),
                ascii::string(b"website"),
                ascii::string(b"description"),
                ctx(&mut scenario)
            );

            // Verify pool was created
            let pool = get_pool<MOCK_TOKEN>(&mut config);
            assert!(!pool.is_completed, 0);

            clock::destroy_for_testing(clock);
            test::return_shared(config);
        };

        transfer::public_transfer(treasury_cap, ADMIN);
        // test::return_to_sender(&scenario, treasury_cap);

        test::end(scenario);
    }

    #[test]
    fun test_buy_tokens() {
        let mut scenario = test::begin(@0x1);
        test_setup(&mut scenario);

        let _witness = MOCK_TOKEN {};
        let mut treasury_cap = create_mock_treasury_cap(_witness, &mut scenario);

        // Test buying tokens
        next_tx(&mut scenario, USER1);
        {
            let mut config = test::take_shared<Configuration>(&scenario);
            let clock = clock::create_for_testing(ctx(&mut scenario));

            let mut _pools = test::take_shared<Pools>(&scenario);
            let _config = test::take_shared<GlobalConfig>(&scenario);
            let _url: std::string::String = std::string::utf8(b"Hello");

            // Create pool
            create_pool_for_test();

            let mut sui_coin = coin::mint_for_testing(1000000000, ctx(&mut scenario));

            buy<MOCK_TOKEN>(
                &mut config,
                &mut sui_coin,
                1000000000, // max_sui_in
                1000000, // token_out
                &mut _pools,
                &_config,
                _url,
                &clock,
                ctx(&mut scenario)
            );

            // Verify the user received tokens
            let receiver = test::take_from_address<Coin<MOCK_TOKEN>>(&scenario, USER1);
            let token_balance = coin::value<MOCK_TOKEN>(&receiver);
            assert!(token_balance > 0, 0);

            transfer::public_transfer(sui_coin, USER1);
            clock::destroy_for_testing(clock);
            coin::destroy_zero<MOCK_TOKEN>(receiver);
            test::return_shared(config);
            test::return_shared(_config);
            test::return_shared(_pools);
        };

        transfer::public_transfer(treasury_cap, ADMIN);
        test::end(scenario);
    }

    #[test]
    fun test_sell_tokens() {
        let mut scenario = test::begin(@0x1);
        test_setup(&mut scenario);

        let _witness = MOCK_TOKEN {};
        let treasury_cap = create_mock_treasury_cap(_witness, &mut scenario);

        // Buy tokens first
        next_tx(&mut scenario, USER1);
        {
            let mut config = test::take_shared<Configuration>(&scenario);
            let clock = clock::create_for_testing(ctx(&mut scenario));

            let mut _pools = test::take_shared<Pools>(&scenario);
            let _config = test::take_shared<GlobalConfig>(&scenario);
            let _url: std::string::String = std::string::utf8(b"Hello");

            // Create pool
            create_pool_for_test();

            let mut sui_coin = coin::mint_for_testing<SUI>(1000000000, ctx(&mut scenario));

            buy<MOCK_TOKEN>(
                &mut config,
                &mut sui_coin,
                1000000000,
                1000000,
                &mut _pools,
                &_config,
                _url,
                &clock,
                ctx(&mut scenario)
            );

            transfer::public_transfer(sui_coin, USER1);
            clock::destroy_for_testing(clock);
            test::return_shared(config);
            test::return_shared(_config);
            test::return_shared(_pools);
        };

        // Test selling tokens
        next_tx(&mut scenario, USER1);
        {
            let mut config = test::take_shared<Configuration>(&scenario);
            let clock = clock::create_for_testing(ctx(&mut scenario));

            let mut token_coin = test::take_from_address<Coin<MOCK_TOKEN>>(&scenario, USER1);
            let _initial_balance = coin::value(&token_coin);

            sell<MOCK_TOKEN>(
                &mut config,
                token_coin,
                100000, // min_sui_received
                &clock,
                ctx(&mut scenario)
            );

            // Verify the user received SUI
            let receiver = test::take_from_address<Coin<MOCK_TOKEN>>(&scenario, USER1);
            let token_balance = coin::value<MOCK_TOKEN>(&receiver);
            assert!(token_balance > 0, 0);

            clock::destroy_for_testing(clock);
            coin::destroy_zero<MOCK_TOKEN>(receiver);
            test::return_shared(config);
        };

        transfer::public_transfer(treasury_cap, ADMIN);
        test::end(scenario);
    }

    #[test]
    fun test_transfer_admin() {
        let mut scenario = test::begin(@0x1);
        test_setup(&mut scenario);

        next_tx(&mut scenario, ADMIN);
        {
            let mut config = test::take_shared<Configuration>(&scenario);
            let clock = clock::create_for_testing(ctx(&mut scenario));

            transfer_admin(
                &mut config,
                USER1,
                &clock,
                ctx(&mut scenario)
            );

            assert!(config.admin == USER1, 0);

            clock::destroy_for_testing(clock);
            test::return_shared(config);
        };

        test::end(scenario);
    }

    #[test]
    fun test_update_config() {
        let mut scenario = test::begin(@0x1);
        test_setup(&mut scenario);

        next_tx(&mut scenario, ADMIN);
        {
            let mut config = test::take_shared<Configuration>(&scenario);
            let clock = clock::create_for_testing(ctx(&mut scenario));

            let new_platform_fee = 100;
            let new_graduated_fee = 400000000;
            let new_initial_virtual_sui_reserves = 4000000000;
            let new_initial_virtual_token_reserves = 12000000000000;
            let new_remain_token_reserves = 2500000000000;

            update_config(
                &mut config,
                new_platform_fee,
                new_graduated_fee,
                new_initial_virtual_sui_reserves,
                new_initial_virtual_token_reserves,
                new_remain_token_reserves,
                &clock,
                ctx(&mut scenario)
            );

            assert!(
                config.platform_fee == new_platform_fee,
                0
            );
            assert!(
                config.graduated_fee == new_graduated_fee,
                1
            );

            clock::destroy_for_testing(clock);
            test::return_shared(config);
        };

        test::end(scenario);
    }

    #[test]
    fun test_in_and_out_utils() {
        let amountOut = get_amount_out(
            1_400_000_000,
            30_000_000_000,
            1_073_000_000_000_000
        );
        assert!(amountOut == 47_840_764_331_210, 1);
        assert!(
            get_amount_in(
                amountOut,
                30_000_000_000,
                1_073_000_000_000_000
            ) == 1_400_000_000,
            1
        );

        let amountIn = get_amount_in(
            47_840_000_000_000,
            30_000_000_000,
            1_073_000_000_000_000
        );
        assert!(amountIn == 1_399_976_590, 1);
        assert!(
            get_amount_out(
                amountIn,
                30_000_000_000,
                1_073_000_000_000_000
            ) == 47_840_000_031_987,
            1
        );
    }

    #[test, expected_failure(abort_code = EEMPTY_AMOUNT_IN)]
    fun test_swap_failed_when_input_too_small() {
        let mut scenario = test::begin(@0x1);

        test_setup(&mut scenario);

        next_tx(&mut scenario, USER2);
        {
            let mut pool = test::take_shared<Pool<MOCK_TOKEN>>(&scenario);

            let (token_swapped, sui_swapped) = swap<MOCK_TOKEN>(
                &mut pool,
                coin::zero<MOCK_TOKEN>(ctx(&mut scenario)),
                coin::zero<SUI>(ctx(&mut scenario)),
                0,
                0,
                ctx(&mut scenario)
            );

            coin::destroy_zero<MOCK_TOKEN>(token_swapped);
            coin::destroy_zero<SUI>(sui_swapped);
            test::return_shared(pool);
        };

        test::end(scenario);
    }
}
