import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '6rem 0',
        textAlign: 'center'
      }}>
        <div className="container">
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '700',
            marginBottom: '1.5rem',
            lineHeight: '1.2'
          }}>
            Shop Now, Pay Later with Paya
          </h1>
          <p style={{
            fontSize: '1.25rem',
            marginBottom: '2rem',
            opacity: 0.9,
            maxWidth: '600px',
            margin: '0 auto 2rem'
          }}>
            Discover amazing products from Kenyan businesses and pay with our flexible BNPL solution. 
            Get what you need today, pay over time.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/marketplace" className="btn btn-lg" style={{ background: 'white', color: '#667eea' }}>
              Start Shopping
            </Link>
            {!user && (
              <Link to="/register" className="btn btn-outline btn-lg" style={{ borderColor: 'white', color: 'white' }}>
                Sign Up Free
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '5rem 0', background: 'white' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '600', marginBottom: '1rem', color: '#2d3748' }}>
              Why Choose Paya?
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#718096', maxWidth: '600px', margin: '0 auto' }}>
              We make shopping easy and affordable for everyone in Kenya
            </p>
          </div>

          <div className="grid grid-cols-3">
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💳</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#2d3748' }}>
                Buy Now, Pay Later
              </h3>
              <p style={{ color: '#718096' }}>
                Get your products today and pay over 30 days with our flexible BNPL solution.
              </p>
            </div>

            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏪</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#2d3748' }}>
                Support Local Business
              </h3>
              <p style={{ color: '#718096' }}>
                Shop from verified Kenyan merchants and support the local economy.
              </p>
            </div>

            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚚</div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#2d3748' }}>
                Fast Delivery
              </h3>
              <p style={{ color: '#718096' }}>
                Quick and reliable delivery across Kenya from our network of merchants.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Merchants Section */}
      <section style={{ padding: '5rem 0', background: '#f8fafc' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4rem',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: '600', marginBottom: '1.5rem', color: '#2d3748' }}>
                Grow Your Business with Paya
              </h2>
              <p style={{ fontSize: '1.125rem', color: '#718096', marginBottom: '2rem' }}>
                Join thousands of Kenyan merchants who are growing their sales with our marketplace platform. 
                Get paid instantly with our 99% advance rate on every sale.
              </p>
              <ul style={{ marginBottom: '2rem', listStyle: 'none', padding: 0 }}>
                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', color: '#4a5568' }}>
                  <span style={{ marginRight: '0.75rem', color: '#48bb78' }}>✓</span>
                  99% advance rate on all sales
                </li>
                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', color: '#4a5568' }}>
                  <span style={{ marginRight: '0.75rem', color: '#48bb78' }}>✓</span>
                  Easy product management
                </li>
                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', color: '#4a5568' }}>
                  <span style={{ marginRight: '0.75rem', color: '#48bb78' }}>✓</span>
                  Reach more customers
                </li>
                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem', color: '#4a5568' }}>
                  <span style={{ marginRight: '0.75rem', color: '#48bb78' }}>✓</span>
                  No upfront costs
                </li>
              </ul>
              <Link to="/merchant-onboarding" className="btn btn-primary btn-lg">
                Become a Merchant
              </Link>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              padding: '3rem',
              color: 'white',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📈</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>
                Start Selling Today
              </h3>
              <p style={{ opacity: 0.9 }}>
                Simple onboarding process. Upload your business documents and start selling within 24 hours.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        background: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
        color: 'white',
        padding: '4rem 0',
        textAlign: 'center'
      }}>
        <div className="container">
          <h2 style={{ fontSize: '2rem', fontWeight: '600', marginBottom: '1rem' }}>
            Ready to Start Shopping?
          </h2>
          <p style={{ fontSize: '1.125rem', marginBottom: '2rem', opacity: 0.9 }}>
            Join thousands of satisfied customers shopping with Paya
          </p>
          <Link to="/marketplace" className="btn btn-primary btn-lg">
            Browse Products
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
