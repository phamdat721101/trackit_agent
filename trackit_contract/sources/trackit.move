module trackit::trackit {
    use std::string::{String, utf8};
    use aptos_std::comparator;
    use aptos_std::math128;
    use aptos_std::math64::mul_div;
    use aptos_std::string_utils::{to_string, to_string_with_canonical_addresses};
    use aptos_framework::event;
    use aptos_framework::fungible_asset::Metadata;
    use aptos_framework::object;
    use aptos_framework::object::Object;
    use aptos_framework::timestamp;

    const MINIMUM_LIQUIDITY: u64 = 1_000;
    const FEE_SCALE: u128 = 1_000;
    const FEE_TIER_A: u64 = 997;

    const EINCORRECT_COIN_ORDER: u64 = 0xb1;
    const ENOT_SUPPORT_FEE_TIER: u64 = 0xb2;
    const ELIQUIDITY_INSUFFICIENT_A_AMOUNT: u64 = 0xb3;
    const ELIQUIDITY_INSUFFICIENT_B_AMOUNT: u64 = 0xb4;
    const EAMOUNT_OUT_LESS_THAN_EXPECTED: u64 = 0xb5;
    const EOVERLIMIT_A_AMOUNT: u64 = 0xb6;
    const EINVALID_LIQUIDITY: u64 = 0xb7;

    struct Pool has drop, store {
        coin_a: Object<Metadata>,
        coin_b: Object<Metadata>,
        fee: u64,
        reserve_a: u64,
        reserve_b: u64,
        total_shares: u128,
    }

    #[event]
    struct PoolCreated has store, drop {
        pool_id: String,
        coin_a: address,
        coin_b: address,
        fee: u64,
        creator: address,
        ts: u64
    }

    #[event]
    struct LiquidityAdded has store, drop {
        pool_id: String,
        amount_a: u64,
        amount_b: u64,
        minted_shares: u64,
        creator: address,
        ts: u64
    }

    #[event]
    struct LiquidityRemoved has store, drop {
        pool_id: String,
        amount_a: u64,
        amount_b: u64,
        burned_shares: u64,
        creator: address,
        ts: u64
    }

    #[event]
    struct Swapped has store, drop {
        pool_id: String,
        amount_in: u64,
        amount_out: u64,
        reserve_a: u64,
        reserve_b: u64,
        a_to_b: bool,
        creator: address,
        ts: u64
    }

    public fun create_pool(
        addr_a: address,
        addr_b: address,
        fee: u64,
        creator: address
    ): (String, Pool) {
        let (pool_id, coin_a, coin_b) = retrieve_pool_info(addr_a, addr_b, fee);

        let pool = Pool {
            coin_a,
            coin_b,
            fee,
            reserve_a: 0,
            reserve_b: 0,
            total_shares: 0
        };

        event::emit(
            PoolCreated {
                pool_id,
                coin_a: addr_a,
                coin_b: addr_b,
                fee,
                creator,
                ts: timestamp::now_microseconds(),
            }
        );

        (pool_id, pool)
    }

    public fun add_liquidity(
        pool_id: String,
        pool: &mut Pool,
        amount_a: u64,
        amount_b: u64,
        min_amount_a: u64,
        min_amount_b: u64,
        creator: address
    ): (u64, u64, u64, Object<Metadata>, Object<Metadata>) {
        let (amount_a, amount_b) =
            calc_optimal_lp_amount(pool.reserve_a, pool.reserve_b, amount_a, amount_b, min_amount_a, min_amount_b);

        let minted_shares =
            if (pool.total_shares == 0) {
                pool.total_shares += (MINIMUM_LIQUIDITY as u128);
                (math128::sqrt((amount_a as u128) * (amount_b as u128)) as u64) - MINIMUM_LIQUIDITY
            } else {
                compute_minted_shares(
                    (amount_a as u128),
                    (amount_b as u128),
                    (pool.reserve_a as u128) + (amount_a as u128),
                    (pool.reserve_b as u128) + (amount_b as u128),
                    pool.total_shares
                )
            };

        assert!(minted_shares > 0, EINVALID_LIQUIDITY);

        pool.reserve_a += amount_a;
        pool.reserve_b += amount_b;
        pool.total_shares += (minted_shares as u128);

        event::emit(
            LiquidityAdded {
                pool_id,
                amount_a,
                amount_b,
                minted_shares,
                creator,
                ts: timestamp::now_microseconds(),
            }
        );

        (minted_shares, amount_a, amount_b, pool.coin_a, pool.coin_b)
    }

    public fun remove_liquidity(
        pool_id: String,
        pool: &mut Pool,
        burned_shares: u64,
        amount_a_min: u64,
        amount_b_min: u64,
        creator: address
    ): (u64, u64, Object<Metadata>, Object<Metadata>) {
        let (amount_a, amount_b) =
            compute_lp_from_shares(
                (burned_shares as u128),
                pool.total_shares,
                (pool.reserve_a as u128),
                (pool.reserve_b as u128),
            );

        assert!(amount_a > 0 && amount_b > 0, EAMOUNT_OUT_LESS_THAN_EXPECTED);
        assert!(amount_a >= amount_a_min && amount_b >= amount_b_min, EAMOUNT_OUT_LESS_THAN_EXPECTED);

        pool.reserve_a -= amount_a;
        pool.reserve_b -= amount_b;
        pool.total_shares -= (burned_shares as u128);

        event::emit(
            LiquidityRemoved {
                pool_id,
                amount_a,
                amount_b,
                burned_shares,
                creator,
                ts: timestamp::now_microseconds(),
            }
        );

        (amount_a, amount_b, pool.coin_a, pool.coin_b)
    }

    public fun swap_exact_tokens_for_tokens(
        pool_id: String,
        pool: &mut Pool,
        amount_in: u64,
        amount_out_min: u64,
        a_to_b: bool,
        creator: address
    ): (u64, u64, Object<Metadata>, Object<Metadata>) {
        let amount_out =
            if (a_to_b) {
                compute_amount_out(amount_in, pool.reserve_a, pool.reserve_b, pool.fee)
            } else {
                compute_amount_out(amount_in, pool.reserve_b, pool.reserve_a, pool.fee)
            };

        assert!(amount_out >= amount_out_min, EAMOUNT_OUT_LESS_THAN_EXPECTED);

        update_reserve_after_swap(
            pool_id,
            pool,
            amount_in,
            amount_out,
            a_to_b,
            creator
        )
    }

    public fun swap_tokens_for_exact_tokens(
        pool_id: String,
        pool: &mut Pool,
        amount_out: u64,
        amount_in_max: u64,
        a_to_b: bool,
        creator: address
    ): (u64, u64, Object<Metadata>, Object<Metadata>) {
        let amount_in =
            if (a_to_b) {
                compute_amount_in(amount_out, pool.reserve_a, pool.reserve_b, pool.fee)
            } else {
                compute_amount_in(amount_out, pool.reserve_b, pool.reserve_a, pool.fee)
            };

        assert!(amount_in <= amount_in_max, EAMOUNT_OUT_LESS_THAN_EXPECTED);

        update_reserve_after_swap(
            pool_id,
            pool,
            amount_in,
            amount_out,
            a_to_b,
            creator
        )
    }

    inline fun update_reserve_after_swap(
        pool_id: String,
        pool: &mut Pool,
        amount_in: u64,
        amount_out: u64,
        a_to_b: bool,
        creator: address
    ): (u64, u64, Object<Metadata>, Object<Metadata>) {
        let invariant_before = (pool.reserve_a as u128) * (pool.reserve_b as u128);

        if (a_to_b) {
            pool.reserve_a += amount_in;
            pool.reserve_b -= amount_out;
        } else {
            pool.reserve_a -= amount_out;
            pool.reserve_b += amount_in;
        };

        let invariant_after = (pool.reserve_a as u128) * (pool.reserve_b as u128);

        assert!(invariant_after >= invariant_before, EINVALID_LIQUIDITY);

        event::emit(
            Swapped {
                pool_id,
                amount_in,
                amount_out,
                reserve_a: pool.reserve_a,
                reserve_b: pool.reserve_b,
                a_to_b,
                creator,
                ts: timestamp::now_microseconds(),
            }
        );

        if (a_to_b) {
            (amount_in, amount_out, pool.coin_a, pool.coin_b)
        } else {
            (amount_out, amount_in, pool.coin_b, pool.coin_a)
        }
    }

    public fun retrieve_pool_info(
        addr_a: address,
        addr_b: address,
        fee: u64
    ): (String, Object<Metadata>, Object<Metadata>) {
        assert_fee(fee);

        let coin_a = object::address_to_object<Metadata>(addr_a);
        let coin_b = object::address_to_object<Metadata>(addr_b);

        assert_coin_order(&coin_a, &coin_b);

        let pool_id = utf8(b"");
        pool_id.append(to_string_with_canonical_addresses(&addr_a));
        pool_id.append(utf8(b"-"));
        pool_id.append(to_string_with_canonical_addresses(&addr_b));
        pool_id.append(utf8(b"-"));
        pool_id.append(to_string(&fee));

        (pool_id, coin_a, coin_b)
    }

    inline fun compute_amount_out(
        amount_in: u64,
        reserve_in: u64,
        reserve_out: u64,
        fee: u64
    ): u64 {
        let amount_in_with_fee = (amount_in as u128) * (fee as u128);
        let denominator = (reserve_in as u128) * FEE_SCALE + amount_in_with_fee;
        (math128::mul_div(
            (reserve_out as u128), amount_in_with_fee,
            denominator
        ) as u64)
    }

    inline fun compute_amount_in(
        amount_out: u64,
        reserve_in: u64,
        reserve_out: u64,
        fee: u64
    ): u64 {
        let numerator = (reserve_in as u128) * (amount_out as u128);
        let denomiator = ((reserve_out - amount_out) as u128) * (fee as u128);
        (math128::mul_div(
            numerator, FEE_SCALE,
            denomiator
        ) as u64) + 1
    }

    inline fun compute_minted_shares(
        amount_a: u128,
        amount_b: u128,
        reserve_a: u128,
        reserve_b: u128,
        total_shares: u128
    ): u64 {
        (math128::min(
            math128::mul_div(amount_a, total_shares, reserve_a),
            math128::mul_div(amount_b, total_shares, reserve_b)
        ) as u64)
    }

    inline fun compute_lp_from_shares(
        share: u128,
        total_shares: u128,
        reserve_a: u128,
        reserve_b: u128
    ): (u64, u64) {
        (
            (math128::mul_div(share, reserve_a, total_shares) as u64),
            (math128::mul_div(share, reserve_b, total_shares) as u64)
        )
    }

    inline fun calc_optimal_lp_amount(
        reserve_a: u64,
        reserve_b: u64,
        desired_amount_a: u64,
        desired_amount_b: u64,
        min_amount_a: u64,
        min_amount_b: u64
    ): (u64, u64) {
        if (reserve_a == 0 && reserve_b == 0) {
            (desired_amount_a, desired_amount_b)
        } else {
            let optimal_b = mul_div(desired_amount_a, reserve_b, reserve_a);
            if (optimal_b <= desired_amount_b) {
                assert!(optimal_b >= min_amount_b, ELIQUIDITY_INSUFFICIENT_B_AMOUNT);
                (desired_amount_a, optimal_b)
            } else {
                let optimal_a = mul_div(desired_amount_b, reserve_a, reserve_b);
                assert!(optimal_a <= desired_amount_a, EOVERLIMIT_A_AMOUNT);
                assert!(optimal_a >= min_amount_a, ELIQUIDITY_INSUFFICIENT_A_AMOUNT);
                (optimal_a, desired_amount_b)
            }
        }
    }

    inline fun assert_fee(amount: u64) {
        if (amount == FEE_TIER_A) {} else {
            abort ENOT_SUPPORT_FEE_TIER
        }
    }

    inline fun assert_coin_order(coin_a: &Object<Metadata>, coin_b: &Object<Metadata>) {
        assert!(comparator::compare(coin_a, coin_b).is_smaller_than(), EINCORRECT_COIN_ORDER);
    }
}