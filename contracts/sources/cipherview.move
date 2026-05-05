/// CipherView - Sui Move smart contract
/// Manages video registry and time-limited access passes on Sui Testnet.
module cipherview::cipherview {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::table::{Self, Table};
    use std::string::{Self, String};

    const EVideoNotFound: u64 = 1;
    const EInsufficientPayment: u64 = 2;

    public struct VideoRegistry has key {
        id: UID,
        videos: Table<String, VideoEntry>,
    }

    public struct VideoEntry has store {
        video_id: String,
        creator: address,
        price_mist: u64,
        duration_ms: u64,
    }

    public struct VideoAccessPass has key, store {
        id: UID,
        video_id: String,
        owner: address,
        expires_at_ms: u64,
    }

    fun init(ctx: &mut TxContext) {
        let registry = VideoRegistry {
            id: object::new(ctx),
            videos: table::new(ctx),
        };
        transfer::share_object(registry);
    }

    public entry fun create_video(
        registry: &mut VideoRegistry,
        video_id: vector<u8>,
        price_mist: u64,
        duration_ms: u64,
        ctx: &mut TxContext,
    ) {
        let id_str = string::utf8(video_id);
        let entry = VideoEntry {
            video_id: id_str,
            creator: tx_context::sender(ctx),
            price_mist,
            duration_ms,
        };
        table::add(&mut registry.videos, string::utf8(video_id), entry);
    }

    public entry fun buy_access(
        registry: &VideoRegistry,
        video_id: vector<u8>,
        payment: Coin<SUI>,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let id_str = string::utf8(video_id);
        assert!(table::contains(&registry.videos, id_str), EVideoNotFound);
        let entry = table::borrow(&registry.videos, id_str);
        let paid = coin::value(&payment);
        assert!(paid >= entry.price_mist, EInsufficientPayment);
        transfer::public_transfer(payment, entry.creator);
        let now_ms = clock::timestamp_ms(clock);
        let pass = VideoAccessPass {
            id: object::new(ctx),
            video_id: string::utf8(video_id),
            owner: tx_context::sender(ctx),
            expires_at_ms: now_ms + entry.duration_ms,
        };
        transfer::transfer(pass, tx_context::sender(ctx));
    }

    public fun has_valid_access(pass: &VideoAccessPass, clock: &Clock): bool {
        clock::timestamp_ms(clock) < pass.expires_at_ms
    }

    public fun get_expiry(pass: &VideoAccessPass): u64 {
        pass.expires_at_ms
    }

    public fun get_video_id(pass: &VideoAccessPass): String {
        pass.video_id
    }
}