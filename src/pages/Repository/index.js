import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { FaArrowAltCircleRight, FaArrowAltCircleLeft } from 'react-icons/fa';
import api from '../../services/api';
import {
  Loading,
  Filter,
  Owner,
  IssueList,
  Button,
  ButtonGroup,
} from './styles';
import Container from '../../components/Container';

export default class Repository extends Component {
  // eslint-disable-next-line react/static-property-placement
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  constructor(props) {
    super(props);
    this.state = {
      repository: {},
      issues: [],
      loading: true,
      filters: [
        { selected: true, title: 'Abertas', status: 'open' },
        { selected: true, title: 'Fechadas', status: 'closed' },
      ],
      status: 'all',
      page: 1,
    };
  }

  async componentDidMount() {
    const { match } = this.props;
    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          state: 'all',
          per_page: 5,
        },
      }),
    ]);
    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  handleCheckboxChange = async (index) => {
    const { filters } = this.state;
    filters[index].selected = !filters[index].selected;
    let status;
    if (!filters[0].selected && filters[1].selected) status = filters[1].status;
    else if (filters[0].selected && !filters[1].selected)
      status = filters[0].status;
    else if (filters[0].selected && filters[1].selected) status = 'all';
    else status = 'none';
    await this.setState({ filters, status });

    this.newRequest();
  };

  previousPage = async () => {
    const { page } = this.state;
    if (page > 1) {
      await this.setState((prevState) => ({ page: prevState.page - 1 }));
      await this.newRequest();
    } else {
      await this.setState({ page: 1 });
    }
  };

  nextPage = async () => {
    await this.setState((prevState) => ({ page: prevState.page + 1 }));
    await this.newRequest();
  };

  async newRequest() {
    const { page, status } = this.state;
    if (status === 'none') {
      this.setState({
        issues: [],
      });
    } else {
      const { match } = this.props;
      const repoName = decodeURIComponent(match.params.repository);
      const issues = await api.get(`/repos/${repoName}/issues`, {
        params: {
          state: status,
          per_page: 5,
          page,
        },
      });
      this.setState({
        issues: issues.data,
      });
    }
  }

  render() {
    const { repository, issues, loading, page, filters } = this.state;

    if (loading) {
      return <Loading>Carregando...</Loading>;
    }
    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>
        <Filter>
          <h3>Filtar por issues: </h3>
          <div>
            {filters.map((filter, index) => (
              <>
                <p>{filter.title}</p>
                <input
                  type="checkbox"
                  name={filter.title}
                  defaultChecked="true"
                  onChange={() => this.handleCheckboxChange(index)}
                />
              </>
            ))}
          </div>
        </Filter>
        <IssueList>
          {issues.length >= 1 ? (
            issues.map((issue) => (
              <li key={String(issue.id)}>
                <img src={issue.user.avatar_url} alt={issue.user.login} />
                <div>
                  <strong>
                    <a
                      href={issue.html_url}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {issue.title}
                    </a>
                    {issue.labels.map((label) => (
                      <span key={String(label.id)}>{label.name}</span>
                    ))}
                  </strong>
                  <p>{issue.user.login}</p>
                </div>
              </li>
            ))
          ) : (
            <li>Sem isues</li>
          )}
        </IssueList>
        <ButtonGroup>
          <Button disabled={page === 1}>
            <FaArrowAltCircleLeft
              color="#7159c1"
              size={24}
              onClick={this.previousPage}
            />
          </Button>
          <Button>
            <FaArrowAltCircleRight
              color="#7159c1"
              size={24}
              onClick={this.nextPage}
            />
          </Button>
        </ButtonGroup>
      </Container>
    );
  }
}
