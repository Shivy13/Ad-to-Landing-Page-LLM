import React from 'react';
import { Card, Col, Badge, ListGroup, ListGroupItem, ProgressBar } from 'react-bootstrap';

const ResultsDisplay = ({ data }) => {
  const { analysis } = data;
  
  if (!analysis) {
    return <p>No analysis data available</p>;
  }
  
  return (
    <>
      <Card className="shadow-sm border-0">
        <Card.Header className="bg-gradient-primary text-white py-4 d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Overall Match Score: <span className="badge bg-light text-dark fs-5">{analysis.overall_match_score}/100</span></h5>
          {/* Score Progress Bar */}
          <div className="w-25">
            <ProgressBar 
              variant={analysis.overall_match_score >= 80 ? 'success' : analysis.overall_match_score >= 50 ? 'warning' : 'danger'} 
              className="mb-0"
              now={analysis.overall_match_score}
              label={`${analysis.overall_match_score}%`}
            />
          </div>
        </Card.Header>
        <Card.Body>
          {analysis.dimensions && Object.keys(analysis.dimensions).length > 0 && (
            <>
              <h6 className="mb-4">Dimension Analysis:</h6>
              <div className="row g-4">
                {Object.entries(analysis.dimensions).map(([dim, data]) => (
                  <Col key={dim} md={6} lg={4}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Header className="bg-light py-3">
                        <h6 className="mb-0">{dim.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</h6>
                      </Card.Header>
                      <Card.Body className="d-flex flex-column">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-bold fs-6">Score: {data.score}/100</span>
                          <Badge 
                            variant={data.score >= 80 ? 'success' : data.score >= 50 ? 'warning' : 'danger'}
                            className="fs-6"
                          >
                            {data.score >= 80 ? 'Good' : data.score >= 50 ? 'Fair' : 'Poor'}
                          </Badge>
                        </div>
                        <div className="mt-auto">
                          <p className="text-muted small mb-2">{data.notes}</p>
                          {data.missing_elements && data.missing_elements.length > 0 && (
                            <>
                              <p className="fw-bold small mt-2 mb-1">Missing Elements:</p>
                              <ul className="list-unstyled small mb-0 ps-3">
                                {data.missing_elements.map((item, i) => (
                                  <li key={i} className="mb-1 d-flex align-items-start">
                                    <i className="bi bi-dash me-2 mt-1"></i> {item}
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </div>
            </>
          )}
          
          {analysis.clusters && analysis.clusters.length > 0 && (
            <>
              <h6 className="mb-4 mt-5">Ad Clusters:</h6>
              <div className="row g-4">
                {analysis.clusters.map((cluster, idx) => (
                  <Col key={idx} md={6}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Header className="bg-gradient-info text-white py-3 d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">Cluster: {cluster.cluster_label}</h6>
                        <Badge className="bg-light text-dark">{cluster.ad_indices.length} Ads</Badge>
                      </Card.Header>
                      <Card.Body>
                        <p className="mb-2"><strong>Ads in cluster:</strong> {cluster.ad_indices.map(i => `Ad ${i+1}`).join(', ')}</p>
                        {cluster.suggested_page_sections && cluster.suggested_page_sections.length > 0 && (
                          <>
                            <p className="fw-bold small mb-2">Suggested Page Sections:</p>
                            <ul className="list-unstyled small mb-0 ps-3">
                              {cluster.suggested_page_sections.map((section, i) => (
                                <li key={i} className="mb-1 d-flex align-items-start">
                                  <i className="bi bi-check-circle me-2 text-success"></i> {section}
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </div>
            </>
          )}
          
          {analysis.actionable_recommendations && analysis.actionable_recommendations.length > 0 && (
            <>
              <h6 className="mb-4 mt-5">Actionable Recommendations:</h6>
              <ListGroup className="list-group-flush border-0">
                {analysis.actionable_recommendations.map((rec, idx) => (
                  <ListGroupItem key={idx} className="border-0 py-3">
                    <div className="d-flex align-items-start">
                      <div className="flex-shrink-0 me-3">
                        <span className="badge bg-primary rounded-pill">{idx + 1}</span>
                      </div>
                      <div className="flex-grow-1">
                        {rec}
                      </div>
                    </div>
                  </ListGroupItem>
                ))}
              </ListGroup>
            </>
          )}
        </Card.Body>
      </Card>
    </>
  );
};

export default ResultsDisplay;